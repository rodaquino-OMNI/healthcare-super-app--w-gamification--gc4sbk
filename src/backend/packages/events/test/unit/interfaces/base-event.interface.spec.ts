/**
 * @file base-event.interface.spec.ts
 * @description Unit tests for the BaseEvent interface implementation and type constraints.
 * These tests verify that BaseEvent objects contain required properties and validate core
 * event structure compliance, proper type inference, and serialization/deserialization behaviors.
 */

import {
  BaseEvent,
  EventMetadata,
  isBaseEvent,
  createEvent,
  validateEvent,
  EventValidationResult
} from '../../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import {
  createTestEvent,
  createMinimalTestEvent,
  createTestEventWithTimestamp,
  createCorrelatedTestEvent,
  createRetryTestEvent,
  createInvalidTestEvent
} from '../../fixtures/base-events';
import { validateBaseEventStructure, validateTimestamp, validateEventMetadata } from '../../utils/event-validators';
import { compareEvents } from '../../utils/event-comparison';

describe('BaseEvent Interface', () => {
  describe('Type Constraints', () => {
    it('should enforce required properties', () => {
      // Create a valid event
      const validEvent: BaseEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' }
      };

      // TypeScript compilation would fail if any required property is missing
      expect(validEvent).toBeDefined();
      expect(validEvent.eventId).toBeDefined();
      expect(validEvent.type).toBeDefined();
      expect(validEvent.timestamp).toBeDefined();
      expect(validEvent.version).toBeDefined();
      expect(validEvent.source).toBeDefined();
      expect(validEvent.payload).toBeDefined();
    });

    it('should allow optional properties', () => {
      // Create an event with optional properties
      const eventWithOptionals: BaseEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' },
        journey: JourneyType.HEALTH,
        userId: 'user-123',
        metadata: {
          correlationId: 'corr-123',
          priority: 'high'
        }
      };

      expect(eventWithOptionals.journey).toBe(JourneyType.HEALTH);
      expect(eventWithOptionals.userId).toBe('user-123');
      expect(eventWithOptionals.metadata).toBeDefined();
      expect(eventWithOptionals.metadata?.correlationId).toBe('corr-123');
      expect(eventWithOptionals.metadata?.priority).toBe('high');
    });

    it('should support generic payload types', () => {
      // Define a custom payload type
      interface TestPayload {
        id: string;
        value: number;
        active: boolean;
      }

      // Create an event with the custom payload type
      const eventWithTypedPayload: BaseEvent<TestPayload> = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: {
          id: 'test-123',
          value: 42,
          active: true
        }
      };

      // TypeScript compilation would fail if payload doesn't match the generic type
      expect(eventWithTypedPayload.payload.id).toBe('test-123');
      expect(eventWithTypedPayload.payload.value).toBe(42);
      expect(eventWithTypedPayload.payload.active).toBe(true);
    });
  });

  describe('isBaseEvent Type Guard', () => {
    it('should return true for valid events', () => {
      const validEvent = createTestEvent();
      expect(isBaseEvent(validEvent)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isBaseEvent(null)).toBe(false);
      expect(isBaseEvent(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isBaseEvent('string')).toBe(false);
      expect(isBaseEvent(123)).toBe(false);
      expect(isBaseEvent(true)).toBe(false);
      expect(isBaseEvent([])).toBe(false);
    });

    it('should return false when required properties are missing', () => {
      const invalidEvent1 = createInvalidTestEvent({ missingEventId: true });
      const invalidEvent2 = createInvalidTestEvent({ missingType: true });
      const invalidEvent3 = createInvalidTestEvent({ missingTimestamp: true });
      const invalidEvent4 = createInvalidTestEvent({ missingVersion: true });
      const invalidEvent5 = createInvalidTestEvent({ missingSource: true });
      const invalidEvent6 = createInvalidTestEvent({ missingPayload: true });

      expect(isBaseEvent(invalidEvent1)).toBe(false);
      expect(isBaseEvent(invalidEvent2)).toBe(false);
      expect(isBaseEvent(invalidEvent3)).toBe(false);
      expect(isBaseEvent(invalidEvent4)).toBe(false);
      expect(isBaseEvent(invalidEvent5)).toBe(false);
      expect(isBaseEvent(invalidEvent6)).toBe(false);
    });

    it('should return false when properties have incorrect types', () => {
      const invalidEvent = createTestEvent();
      
      // Test with incorrect types
      const testCases = [
        { ...invalidEvent, eventId: 123 },
        { ...invalidEvent, type: {} },
        { ...invalidEvent, timestamp: true },
        { ...invalidEvent, version: [] },
        { ...invalidEvent, source: 456 },
        { ...invalidEvent, payload: 'not an object' }
      ];

      testCases.forEach(testCase => {
        expect(isBaseEvent(testCase)).toBe(false);
      });
    });
  });

  describe('createEvent Function', () => {
    it('should create a valid event with required properties', () => {
      const event = createEvent('TEST_EVENT', 'test-service', { data: 'test' });
      
      expect(isBaseEvent(event)).toBe(true);
      expect(event.type).toBe('TEST_EVENT');
      expect(event.source).toBe('test-service');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.eventId).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.version).toBe('1.0.0');
    });

    it('should use provided options when available', () => {
      const options = {
        eventId: 'custom-id',
        timestamp: '2023-01-01T00:00:00.000Z',
        version: '2.0.0',
        userId: 'user-123',
        journey: JourneyType.CARE,
        metadata: {
          correlationId: 'corr-123',
          priority: 'high'
        }
      };

      const event = createEvent('TEST_EVENT', 'test-service', { data: 'test' }, options);
      
      expect(event.eventId).toBe('custom-id');
      expect(event.timestamp).toBe('2023-01-01T00:00:00.000Z');
      expect(event.version).toBe('2.0.0');
      expect(event.userId).toBe('user-123');
      expect(event.journey).toBe(JourneyType.CARE);
      expect(event.metadata).toEqual(options.metadata);
    });

    it('should generate a UUID for eventId when not provided', () => {
      const event = createEvent('TEST_EVENT', 'test-service', { data: 'test' });
      
      // UUID v4 format regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(event.eventId).toMatch(uuidRegex);
    });

    it('should generate current timestamp when not provided', () => {
      const before = new Date();
      const event = createEvent('TEST_EVENT', 'test-service', { data: 'test' });
      const after = new Date();
      
      const eventDate = new Date(event.timestamp);
      expect(eventDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(eventDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should use default version 1.0.0 when not provided', () => {
      const event = createEvent('TEST_EVENT', 'test-service', { data: 'test' });
      expect(event.version).toBe('1.0.0');
    });

    it('should preserve payload type with generics', () => {
      interface TestPayload {
        id: string;
        count: number;
      }

      const payload: TestPayload = {
        id: 'test-123',
        count: 42
      };

      const event = createEvent<TestPayload>('TEST_EVENT', 'test-service', payload);
      
      // TypeScript should infer the correct type
      const retrievedPayload: TestPayload = event.payload;
      expect(retrievedPayload.id).toBe('test-123');
      expect(retrievedPayload.count).toBe(42);
    });
  });

  describe('validateEvent Function', () => {
    it('should validate a valid event', () => {
      const validEvent = createTestEvent();
      const result = validateEvent(validEvent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for null or undefined', () => {
      const result1 = validateEvent(null);
      const result2 = validateEvent(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Event is null or undefined');
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Event is null or undefined');
    });

    it('should return errors for non-object values', () => {
      const result = validateEvent('not an object');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event is not an object');
    });

    it('should return errors when required properties are missing', () => {
      const testCases = [
        { prop: 'eventId', event: createInvalidTestEvent({ missingEventId: true }) },
        { prop: 'type', event: createInvalidTestEvent({ missingType: true }) },
        { prop: 'timestamp', event: createInvalidTestEvent({ missingTimestamp: true }) },
        { prop: 'version', event: createInvalidTestEvent({ missingVersion: true }) },
        { prop: 'source', event: createInvalidTestEvent({ missingSource: true }) },
        { prop: 'payload', event: createInvalidTestEvent({ missingPayload: true }) }
      ];

      testCases.forEach(({ prop, event }) => {
        const result = validateEvent(event);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(`Missing required field: ${prop}`);
      });
    });

    it('should return errors when properties have incorrect types', () => {
      const validEvent = createTestEvent();
      
      const testCases = [
        { prop: 'eventId', value: 123, type: 'string' },
        { prop: 'type', value: {}, type: 'string' },
        { prop: 'timestamp', value: true, type: 'string' },
        { prop: 'version', value: [], type: 'string' },
        { prop: 'source', value: 456, type: 'string' },
        { prop: 'payload', value: 'not an object', type: 'object' }
      ];

      testCases.forEach(({ prop, value, type }) => {
        const invalidEvent = { ...validEvent, [prop]: value };
        const result = validateEvent(invalidEvent);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(`${prop} must be a ${type}`);
      });
    });

    it('should validate optional properties when present', () => {
      const validEvent = createTestEvent();
      
      const testCases = [
        { prop: 'userId', value: 123, type: 'string' },
        { prop: 'metadata', value: 'not an object', type: 'object' }
      ];

      testCases.forEach(({ prop, value, type }) => {
        const invalidEvent = { ...validEvent, [prop]: value };
        const result = validateEvent(invalidEvent);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(`${prop} must be a ${type}`);
      });
    });
  });

  describe('Event Serialization and Deserialization', () => {
    it('should maintain integrity when serialized and deserialized', () => {
      const originalEvent = createTestEvent({
        type: 'SERIALIZATION_TEST',
        payload: { complex: { nested: { data: 'test' } } },
        metadata: {
          correlationId: 'corr-123',
          priority: 'high',
          customData: { foo: 'bar' }
        }
      });
      
      // Serialize and deserialize
      const serialized = JSON.stringify(originalEvent);
      const deserialized = JSON.parse(serialized) as BaseEvent;
      
      // Verify all properties are preserved
      expect(deserialized.eventId).toBe(originalEvent.eventId);
      expect(deserialized.type).toBe(originalEvent.type);
      expect(deserialized.timestamp).toBe(originalEvent.timestamp);
      expect(deserialized.version).toBe(originalEvent.version);
      expect(deserialized.source).toBe(originalEvent.source);
      expect(deserialized.journey).toBe(originalEvent.journey);
      expect(deserialized.userId).toBe(originalEvent.userId);
      
      // Deep equality for complex objects
      expect(deserialized.payload).toEqual(originalEvent.payload);
      expect(deserialized.metadata).toEqual(originalEvent.metadata);
      
      // Verify the deserialized event is still valid
      expect(isBaseEvent(deserialized)).toBe(true);
      expect(validateEvent(deserialized).isValid).toBe(true);
    });

    it('should handle complex nested payloads', () => {
      interface ComplexPayload {
        string: string;
        number: number;
        boolean: boolean;
        date: string;
        array: string[];
        nested: {
          level1: {
            level2: {
              level3: string;
            };
          };
        };
      }

      const complexPayload: ComplexPayload = {
        string: 'test',
        number: 42,
        boolean: true,
        date: new Date().toISOString(),
        array: ['one', 'two', 'three'],
        nested: {
          level1: {
            level2: {
              level3: 'deeply nested value'
            }
          }
        }
      };

      const originalEvent = createEvent<ComplexPayload>(
        'COMPLEX_PAYLOAD_TEST',
        'test-service',
        complexPayload
      );
      
      // Serialize and deserialize
      const serialized = JSON.stringify(originalEvent);
      const deserialized = JSON.parse(serialized) as BaseEvent<ComplexPayload>;
      
      // Verify complex payload is preserved
      expect(deserialized.payload.string).toBe(complexPayload.string);
      expect(deserialized.payload.number).toBe(complexPayload.number);
      expect(deserialized.payload.boolean).toBe(complexPayload.boolean);
      expect(deserialized.payload.date).toBe(complexPayload.date);
      expect(deserialized.payload.array).toEqual(complexPayload.array);
      expect(deserialized.payload.nested.level1.level2.level3)
        .toBe(complexPayload.nested.level1.level2.level3);
    });

    it('should handle metadata with custom properties', () => {
      const metadata: EventMetadata & { customProps: Record<string, any> } = {
        correlationId: 'corr-123',
        traceId: 'trace-456',
        spanId: 'span-789',
        priority: 'high',
        isRetry: false,
        customProps: {
          region: 'us-east-1',
          tenant: 'customer-abc',
          tags: ['important', 'urgent'],
          metrics: {
            duration: 123,
            size: 456
          }
        }
      };

      const originalEvent = createEvent(
        'METADATA_TEST',
        'test-service',
        { data: 'test' },
        { metadata }
      );
      
      // Serialize and deserialize
      const serialized = JSON.stringify(originalEvent);
      const deserialized = JSON.parse(serialized) as BaseEvent;
      
      // Verify metadata is preserved
      expect(deserialized.metadata?.correlationId).toBe(metadata.correlationId);
      expect(deserialized.metadata?.traceId).toBe(metadata.traceId);
      expect(deserialized.metadata?.spanId).toBe(metadata.spanId);
      expect(deserialized.metadata?.priority).toBe(metadata.priority);
      expect(deserialized.metadata?.isRetry).toBe(metadata.isRetry);
      
      // Verify custom properties
      const deserializedMetadata = deserialized.metadata as typeof metadata;
      expect(deserializedMetadata.customProps.region).toBe(metadata.customProps.region);
      expect(deserializedMetadata.customProps.tenant).toBe(metadata.customProps.tenant);
      expect(deserializedMetadata.customProps.tags).toEqual(metadata.customProps.tags);
      expect(deserializedMetadata.customProps.metrics).toEqual(metadata.customProps.metrics);
    });
  });

  describe('Timestamp Validation', () => {
    it('should accept valid ISO timestamps', () => {
      const validTimestamps = [
        new Date().toISOString(),
        '2023-01-01T00:00:00.000Z',
        '2023-01-01T00:00:00Z',
        '2023-01-01T00:00:00.123+00:00'
      ];

      validTimestamps.forEach(timestamp => {
        const event = createTestEventWithTimestamp(timestamp);
        const result = validateTimestamp(event.timestamp);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid timestamp formats', () => {
      const invalidTimestamps = [
        'not-a-timestamp',
        '2023-01-01',
        '01/01/2023',
        '2023-13-01T00:00:00Z', // Invalid month
        '2023-01-32T00:00:00Z'  // Invalid day
      ];

      invalidTimestamps.forEach(timestamp => {
        const event = createTestEvent();
        event.timestamp = timestamp;
        
        const result = validateTimestamp(event.timestamp);
        expect(result.isValid).toBe(false);
      });
    });

    it('should validate timestamps within a valid range', () => {
      const now = Date.now();
      const validEvent = createTestEventWithTimestamp(new Date(now).toISOString());
      
      // Test with various age constraints
      const testCases = [
        { maxAge: 1000, minAge: undefined, timestamp: new Date(now - 500).toISOString(), valid: true },
        { maxAge: 1000, minAge: undefined, timestamp: new Date(now - 2000).toISOString(), valid: false },
        { maxAge: undefined, minAge: 1000, timestamp: new Date(now - 500).toISOString(), valid: false },
        { maxAge: undefined, minAge: 1000, timestamp: new Date(now - 2000).toISOString(), valid: true },
        { maxAge: 3000, minAge: 1000, timestamp: new Date(now - 2000).toISOString(), valid: true },
        { maxAge: 3000, minAge: 1000, timestamp: new Date(now - 500).toISOString(), valid: false },
        { maxAge: 3000, minAge: 1000, timestamp: new Date(now - 4000).toISOString(), valid: false }
      ];

      testCases.forEach(({ maxAge, minAge, timestamp, valid }) => {
        const result = validateTimestamp(timestamp, { maxAge, minAge });
        expect(result.isValid).toBe(valid);
      });
    });

    it('should reject future timestamps', () => {
      const futureTimestamp = new Date(Date.now() + 10000).toISOString();
      const event = createTestEventWithTimestamp(futureTimestamp);
      
      const result = validateTimestamp(event.timestamp);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Event ID Uniqueness', () => {
    it('should generate unique event IDs', () => {
      const eventCount = 100;
      const events = Array.from({ length: eventCount }, () => createTestEvent());
      const eventIds = events.map(event => event.eventId);
      
      // Check for uniqueness by creating a Set and comparing sizes
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(eventCount);
    });

    it('should generate deterministic IDs when requested', () => {
      const type = 'DETERMINISTIC_TEST';
      const timestamp = '2023-01-01T00:00:00.000Z';
      
      // Create multiple events with the same type and timestamp
      const events = Array.from({ length: 5 }, () => 
        createTestEvent({ type, timestamp, deterministic: true })
      );
      
      // All events should have the same ID
      const firstId = events[0].eventId;
      events.forEach(event => {
        expect(event.eventId).toBe(firstId);
      });
      
      // Events with different types should have different IDs
      const differentTypeEvent = createTestEvent({
        type: 'DIFFERENT_TYPE',
        timestamp,
        deterministic: true
      });
      expect(differentTypeEvent.eventId).not.toBe(firstId);
      
      // Events with different timestamps should have different IDs
      const differentTimestampEvent = createTestEvent({
        type,
        timestamp: '2023-01-02T00:00:00.000Z',
        deterministic: true
      });
      expect(differentTimestampEvent.eventId).not.toBe(firstId);
    });
  });

  describe('Metadata Handling', () => {
    it('should validate metadata structure', () => {
      const validMetadata: EventMetadata = {
        correlationId: 'corr-123',
        traceId: 'trace-456',
        spanId: 'span-789',
        priority: 'medium',
        isRetry: false,
        retryCount: 0
      };

      const result = validateEventMetadata(validMetadata);
      expect(result.isValid).toBe(true);
    });

    it('should validate metadata field types', () => {
      const testCases = [
        { field: 'correlationId', value: 123, type: 'string' },
        { field: 'traceId', value: {}, type: 'string' },
        { field: 'priority', value: 'invalid-priority', valid: false },
        { field: 'retryCount', value: '3', type: 'number' }
      ];

      testCases.forEach(({ field, value, type, valid = false }) => {
        const metadata: EventMetadata = {
          correlationId: 'corr-123',
          [field]: value as any
        };

        const result = validateEventMetadata(metadata);
        expect(result.isValid).toBe(valid);
        if (!valid && type) {
          expect(result.errors?.some(e => 
            e.message?.includes(`${field} must be a ${type}`)
          )).toBe(true);
        }
      });
    });

    it('should support retry metadata', () => {
      const originalEvent = createTestEvent();
      const retryEvent = createRetryTestEvent(originalEvent, 3);
      
      expect(retryEvent.metadata?.isRetry).toBe(true);
      expect(retryEvent.metadata?.retryCount).toBe(3);
      expect(retryEvent.metadata?.originalTimestamp).toBe(originalEvent.timestamp);
      
      // Retry event should have a new ID and timestamp
      expect(retryEvent.eventId).not.toBe(originalEvent.eventId);
      expect(retryEvent.timestamp).not.toBe(originalEvent.timestamp);
      
      // But should preserve other properties
      expect(retryEvent.type).toBe(originalEvent.type);
      expect(retryEvent.version).toBe(originalEvent.version);
      expect(retryEvent.source).toBe(originalEvent.source);
      expect(retryEvent.payload).toEqual(originalEvent.payload);
    });

    it('should support correlation tracking', () => {
      const correlationId = 'test-correlation-123';
      const event = createCorrelatedTestEvent(correlationId);
      
      expect(event.metadata?.correlationId).toBe(correlationId);
      expect(event.metadata?.traceId).toBe(`trace-${correlationId}`);
      expect(event.metadata?.spanId).toBeDefined();
    });

    it('should allow custom metadata properties', () => {
      const customMetadata: EventMetadata & { custom: any } = {
        correlationId: 'corr-123',
        custom: {
          region: 'us-east-1',
          feature: 'test-feature',
          flags: ['important', 'urgent']
        }
      };

      const event = createTestEvent({ metadata: customMetadata });
      
      // Standard metadata properties
      expect(event.metadata?.correlationId).toBe(customMetadata.correlationId);
      
      // Custom metadata properties
      const typedMetadata = event.metadata as typeof customMetadata;
      expect(typedMetadata.custom.region).toBe(customMetadata.custom.region);
      expect(typedMetadata.custom.feature).toBe(customMetadata.custom.feature);
      expect(typedMetadata.custom.flags).toEqual(customMetadata.custom.flags);
    });
  });

  describe('Event Comparison', () => {
    it('should compare events for equality', () => {
      const event1 = createTestEvent({
        type: 'COMPARISON_TEST',
        payload: { data: 'test' }
      });
      
      // Create a copy with the same values
      const event2 = { ...event1 };
      
      const result = compareEvents(event1, event2);
      expect(result.matches).toBe(true);
    });

    it('should detect differences in events', () => {
      const event1 = createTestEvent({
        type: 'COMPARISON_TEST',
        payload: { data: 'test' }
      });
      
      const event2 = { ...event1, type: 'DIFFERENT_TYPE' };
      const event3 = { ...event1, payload: { data: 'different' } };
      
      const result1 = compareEvents(event1, event2);
      expect(result1.matches).toBe(false);
      expect(result1.mismatchedFields).toContain('type');
      
      const result2 = compareEvents(event1, event3);
      expect(result2.matches).toBe(false);
      expect(result2.mismatchedFields?.some(field => field.includes('payload'))).toBe(true);
    });

    it('should support ignoring specific fields', () => {
      const event1 = createTestEvent({
        type: 'COMPARISON_TEST',
        payload: { data: 'test' }
      });
      
      // Different eventId and timestamp, but same content
      const event2 = {
        ...event1,
        eventId: 'different-id',
        timestamp: new Date(Date.now() + 1000).toISOString()
      };
      
      // Without ignoring fields, comparison should fail
      const result1 = compareEvents(event1, event2, { ignoreEventId: false });
      expect(result1.matches).toBe(false);
      
      // With ignoring fields, comparison should pass
      const result2 = compareEvents(event1, event2, {
        ignoreFields: ['eventId', 'timestamp']
      });
      expect(result2.matches).toBe(true);
    });

    it('should support timestamp tolerance', () => {
      const now = Date.now();
      const event1 = createTestEventWithTimestamp(new Date(now).toISOString());
      
      // Create events with timestamps within and outside tolerance
      const event2 = createTestEventWithTimestamp(new Date(now + 500).toISOString());
      const event3 = createTestEventWithTimestamp(new Date(now + 2000).toISOString());
      
      // With default tolerance (1000ms), event2 should match but event3 should not
      const result1 = compareEvents(event1, event2);
      expect(result1.matches).toBe(true);
      
      const result2 = compareEvents(event1, event3);
      expect(result2.matches).toBe(false);
      
      // With increased tolerance, event3 should match
      const result3 = compareEvents(event1, event3, { timestampToleranceMs: 3000 });
      expect(result3.matches).toBe(true);
    });
  });

  describe('Extension Patterns', () => {
    it('should support extending BaseEvent for journey-specific events', () => {
      // Define a journey-specific event interface
      interface HealthEvent extends BaseEvent {
        journey: JourneyType.HEALTH;
        payload: {
          metricType: string;
          value: number;
          unit: string;
        };
      }

      // Create a health event
      const healthEvent: HealthEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journey: JourneyType.HEALTH,
        userId: 'user-123',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm'
        }
      };

      // It should still be a valid BaseEvent
      expect(isBaseEvent(healthEvent)).toBe(true);
      expect(validateEvent(healthEvent).isValid).toBe(true);
      
      // But with journey-specific properties
      expect(healthEvent.journey).toBe(JourneyType.HEALTH);
      expect(healthEvent.payload.metricType).toBe('HEART_RATE');
      expect(healthEvent.payload.value).toBe(75);
      expect(healthEvent.payload.unit).toBe('bpm');
    });

    it('should support extending EventMetadata', () => {
      // Define extended metadata interface
      interface ExtendedMetadata extends EventMetadata {
        region: string;
        tenant: string;
        permissions: string[];
      }

      // Create an event with extended metadata
      const event = createTestEvent();
      const extendedMetadata: ExtendedMetadata = {
        correlationId: 'corr-123',
        region: 'us-east-1',
        tenant: 'customer-abc',
        permissions: ['read', 'write']
      };
      
      event.metadata = extendedMetadata;
      
      // It should still be a valid BaseEvent
      expect(isBaseEvent(event)).toBe(true);
      expect(validateEvent(event).isValid).toBe(true);
      
      // But with extended metadata properties
      const typedMetadata = event.metadata as ExtendedMetadata;
      expect(typedMetadata.region).toBe('us-east-1');
      expect(typedMetadata.tenant).toBe('customer-abc');
      expect(typedMetadata.permissions).toEqual(['read', 'write']);
    });
  });
});
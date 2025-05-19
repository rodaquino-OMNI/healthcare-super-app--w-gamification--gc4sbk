import { v4 as uuidv4 } from 'uuid';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';

describe('BaseEvent Interface', () => {
  // Test for required properties
  describe('Required Properties', () => {
    it('should contain all required properties', () => {
      const event: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data' }
      };

      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('version');
      expect(event).toHaveProperty('source');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('payload');
    });

    it('should enforce required properties with TypeScript', () => {
      // @ts-expect-error - Missing required properties
      const invalidEvent: BaseEvent = {};

      // @ts-expect-error - Missing timestamp
      const missingTimestamp: BaseEvent = {
        eventId: uuidv4(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data' }
      };

      // This is just a type check test, no runtime assertions needed
      expect(true).toBeTruthy();
    });
  });

  // Test for type inference with generic payload
  describe('Type Inference', () => {
    interface TestPayload {
      id: number;
      name: string;
      active: boolean;
    }

    it('should properly infer payload type with generics', () => {
      const payload: TestPayload = {
        id: 1,
        name: 'Test',
        active: true
      };

      const event: BaseEvent<TestPayload> = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload
      };

      expect(event.payload).toEqual(payload);
      expect(event.payload.id).toBe(1);
      expect(event.payload.name).toBe('Test');
      expect(event.payload.active).toBe(true);
    });

    it('should enforce payload type constraints', () => {
      const event: BaseEvent<TestPayload> = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: {
          id: 1,
          name: 'Test',
          active: true
        }
      };

      // @ts-expect-error - Invalid payload property
      event.payload.invalid = 'property';

      // @ts-expect-error - Missing required payload property
      const invalidPayload: BaseEvent<TestPayload> = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: {
          id: 1,
          name: 'Test'
          // missing active property
        }
      };

      // This is just a type check test, no runtime assertions needed
      expect(true).toBeTruthy();
    });
  });

  // Test for serialization and deserialization
  describe('Serialization and Deserialization', () => {
    it('should properly serialize and deserialize events', () => {
      const originalEvent: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data', nested: { value: 123 } }
      };

      // Serialize to JSON string
      const serialized = JSON.stringify(originalEvent);
      
      // Deserialize back to object
      const deserialized: BaseEvent = JSON.parse(serialized);

      // Verify all properties are preserved
      expect(deserialized.eventId).toBe(originalEvent.eventId);
      expect(deserialized.timestamp).toBe(originalEvent.timestamp);
      expect(deserialized.version).toBe(originalEvent.version);
      expect(deserialized.source).toBe(originalEvent.source);
      expect(deserialized.type).toBe(originalEvent.type);
      expect(deserialized.payload).toEqual(originalEvent.payload);
      expect(deserialized.payload.nested.value).toBe(123);
    });

    it('should handle complex nested objects in payload', () => {
      const complexPayload = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ],
        metadata: {
          count: 2,
          filters: {
            active: true,
            categories: ['A', 'B']
          }
        },
        timestamp: new Date().toISOString()
      };

      const originalEvent: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'COMPLEX_EVENT',
        payload: complexPayload
      };

      // Serialize to JSON string
      const serialized = JSON.stringify(originalEvent);
      
      // Deserialize back to object
      const deserialized: BaseEvent = JSON.parse(serialized);

      // Verify complex payload is preserved
      expect(deserialized.payload).toEqual(complexPayload);
      expect(deserialized.payload.items.length).toBe(2);
      expect(deserialized.payload.items[0].name).toBe('Item 1');
      expect(deserialized.payload.metadata.filters.categories).toEqual(['A', 'B']);
    });
  });

  // Test for timestamp format validation
  describe('Timestamp Format', () => {
    it('should use ISO format for timestamp', () => {
      const event: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data' }
      };

      // ISO 8601 format regex
      const isoFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(event.timestamp).toMatch(isoFormatRegex);
    });

    it('should reject invalid timestamp formats', () => {
      const createEventWithInvalidTimestamp = () => {
        const event: BaseEvent = {
          eventId: uuidv4(),
          // @ts-expect-error - Invalid timestamp format
          timestamp: '2023-01-01', // Not ISO format
          version: '1.0.0',
          source: 'test-service',
          type: 'TEST_EVENT',
          payload: { test: 'data' }
        };
        return event;
      };

      // This is a type check test, but we can also verify at runtime
      // that the timestamp doesn't match ISO format
      const event = createEventWithInvalidTimestamp();
      const isoFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(event.timestamp).not.toMatch(isoFormatRegex);
    });
  });

  // Test for eventId uniqueness
  describe('EventId Uniqueness', () => {
    it('should generate unique eventIds for different events', () => {
      const event1: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data1' }
      };

      const event2: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data2' }
      };

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should validate eventId as UUID format', () => {
      const event: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data' }
      };

      // UUID v4 format regex
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(event.eventId).toMatch(uuidV4Regex);
    });
  });

  // Test for metadata handling
  describe('Metadata Handling', () => {
    it('should support optional metadata field', () => {
      const event: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        metadata: {
          correlationId: uuidv4(),
          userId: '12345',
          traceId: 'trace-123'
        }
      };

      expect(event).toHaveProperty('metadata');
      expect(event.metadata).toHaveProperty('correlationId');
      expect(event.metadata).toHaveProperty('userId', '12345');
      expect(event.metadata).toHaveProperty('traceId', 'trace-123');
    });

    it('should allow events without metadata', () => {
      const event: BaseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data' }
        // No metadata
      };

      expect(event.metadata).toBeUndefined();
    });
  });

  // Test for extension patterns
  describe('Extension Patterns', () => {
    interface HealthMetricEvent extends BaseEvent<{ metricType: string; value: number }> {
      journeyId: string;
      userId: string;
    }

    it('should support extending the base event interface', () => {
      const healthEvent: HealthMetricEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        type: 'HEALTH_METRIC_RECORDED',
        payload: {
          metricType: 'HEART_RATE',
          value: 75
        },
        journeyId: 'health',
        userId: 'user-123',
        metadata: {
          deviceId: 'device-456'
        }
      };

      // Verify base properties
      expect(healthEvent).toHaveProperty('eventId');
      expect(healthEvent).toHaveProperty('timestamp');
      expect(healthEvent).toHaveProperty('version');
      expect(healthEvent).toHaveProperty('source');
      expect(healthEvent).toHaveProperty('type');
      expect(healthEvent).toHaveProperty('payload');
      
      // Verify extended properties
      expect(healthEvent).toHaveProperty('journeyId', 'health');
      expect(healthEvent).toHaveProperty('userId', 'user-123');
      
      // Verify payload with specific type
      expect(healthEvent.payload).toHaveProperty('metricType', 'HEART_RATE');
      expect(healthEvent.payload).toHaveProperty('value', 75);
    });

    it('should enforce extended interface constraints', () => {
      // @ts-expect-error - Missing required extended property
      const invalidHealthEvent: HealthMetricEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        type: 'HEALTH_METRIC_RECORDED',
        payload: {
          metricType: 'HEART_RATE',
          value: 75
        },
        // Missing journeyId
        userId: 'user-123'
      };

      // @ts-expect-error - Invalid payload property type
      const invalidPayloadType: HealthMetricEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        type: 'HEALTH_METRIC_RECORDED',
        payload: {
          metricType: 'HEART_RATE',
          value: 'not-a-number' // Should be a number
        },
        journeyId: 'health',
        userId: 'user-123'
      };

      // This is just a type check test, no runtime assertions needed
      expect(true).toBeTruthy();
    });
  });
});
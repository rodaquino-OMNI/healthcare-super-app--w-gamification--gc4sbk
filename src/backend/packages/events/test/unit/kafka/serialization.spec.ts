import { Buffer } from 'buffer';
import {
  serializeEvent,
  deserializeEvent,
  serializeBinaryEvent,
  deserializeBinaryEvent,
  serializeJourneyEvent,
  deserializeJourneyEvent,
  isVersionSupported,
  extractEventVersion,
  isSerializedEvent,
  EventSerializationError
} from '../../../src/utils/event-serializer';

describe('Event Serialization Utilities', () => {
  // Test fixtures
  const simpleEvent = {
    id: '123',
    type: 'test-event',
    timestamp: '2023-01-01T00:00:00.000Z',
    payload: {
      message: 'Hello, world!',
      count: 42
    }
  };

  const eventWithBinaryData = {
    id: '456',
    type: 'binary-event',
    data: Buffer.from('Binary data for testing', 'utf8'),
    nestedData: {
      buffer: Buffer.from([1, 2, 3, 4]),
      array: [Buffer.from('Array item', 'utf8')]
    }
  };

  const journeyEvent = {
    id: '789',
    type: 'health-metric-recorded',
    userId: 'user-123',
    payload: {
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      recordedAt: '2023-01-01T12:30:00.000Z'
    }
  };

  describe('Basic Serialization and Deserialization', () => {
    it('should serialize and deserialize a simple event', () => {
      // Serialize the event
      const serialized = serializeEvent(simpleEvent);
      
      // Verify it's a string
      expect(typeof serialized).toBe('string');
      
      // Deserialize the event
      const deserialized = deserializeEvent(serialized);
      
      // Verify the deserialized event matches the original
      expect(deserialized).toEqual(simpleEvent);
    });

    it('should serialize with a specific version', () => {
      const version = '2.0.0';
      const serialized = serializeEvent(simpleEvent, version);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.version).toBe(version);
      
      // Should throw when deserializing with default options since version 2.0.0 is not supported
      expect(() => deserializeEvent(serialized)).toThrow();
      
      // Should work when allowing unknown versions
      const deserialized = deserializeEvent(serialized, { allowUnknownVersion: true });
      expect(deserialized).toEqual(simpleEvent);
    });

    it('should serialize with pretty printing', () => {
      const serialized = serializeEvent(simpleEvent, '1.0.0', { pretty: true });
      
      // Pretty printed JSON should contain newlines
      expect(serialized).toContain('\n');
      
      // Should still deserialize correctly
      const deserialized = deserializeEvent(serialized);
      expect(deserialized).toEqual(simpleEvent);
    });

    it('should include custom metadata in serialized event', () => {
      const metadata = {
        source: 'test-suite',
        correlationId: 'corr-123'
      };
      
      const serialized = serializeEvent(simpleEvent, '1.0.0', { metadata });
      const parsed = JSON.parse(serialized);
      
      expect(parsed.meta).toBeDefined();
      expect(parsed.meta.source).toBe(metadata.source);
      expect(parsed.meta.correlationId).toBe(metadata.correlationId);
      expect(parsed.meta.timestamp).toBeDefined(); // Should always include timestamp
      
      // Metadata shouldn't affect the deserialized event data
      const deserialized = deserializeEvent(serialized);
      expect(deserialized).toEqual(simpleEvent);
    });
  });

  describe('Binary Data Handling', () => {
    it('should serialize and deserialize Buffer objects', () => {
      const event = { data: Buffer.from('test buffer', 'utf8') };
      
      const serialized = serializeBinaryEvent(event);
      const deserialized = deserializeBinaryEvent(serialized);
      
      // Buffer objects should be preserved
      expect(deserialized.data).toBeInstanceOf(Buffer);
      expect(Buffer.from('test buffer', 'utf8').equals(deserialized.data as Buffer)).toBe(true);
    });

    it('should serialize and deserialize ArrayBuffer objects', () => {
      const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
      const event = { data: buffer };
      
      const serialized = serializeBinaryEvent(event);
      const deserialized = deserializeBinaryEvent(serialized);
      
      // ArrayBuffer should be preserved
      expect(deserialized.data).toBeInstanceOf(ArrayBuffer);
      
      // Compare the contents
      const originalArray = new Uint8Array(buffer);
      const deserializedArray = new Uint8Array(deserialized.data as ArrayBuffer);
      expect(Array.from(deserializedArray)).toEqual(Array.from(originalArray));
    });

    it('should serialize and deserialize Uint8Array objects', () => {
      const array = new Uint8Array([5, 6, 7, 8]);
      const event = { data: array };
      
      const serialized = serializeBinaryEvent(event);
      const deserialized = deserializeBinaryEvent(serialized);
      
      // Uint8Array should be preserved
      expect(deserialized.data).toBeInstanceOf(Uint8Array);
      expect(Array.from(deserialized.data as Uint8Array)).toEqual(Array.from(array));
    });

    it('should serialize and deserialize Int8Array objects', () => {
      const array = new Int8Array([-1, 0, 1, 2]);
      const event = { data: array };
      
      const serialized = serializeBinaryEvent(event);
      const deserialized = deserializeBinaryEvent(serialized);
      
      // Int8Array should be preserved
      expect(deserialized.data).toBeInstanceOf(Int8Array);
      expect(Array.from(deserialized.data as Int8Array)).toEqual(Array.from(array));
    });

    it('should handle nested binary data in objects and arrays', () => {
      const serialized = serializeBinaryEvent(eventWithBinaryData);
      const deserialized = deserializeBinaryEvent(serialized);
      
      // Top-level binary data
      expect(deserialized.data).toBeInstanceOf(Buffer);
      expect(Buffer.from('Binary data for testing', 'utf8').equals(deserialized.data as Buffer)).toBe(true);
      
      // Nested binary data in object
      expect(deserialized.nestedData.buffer).toBeInstanceOf(Buffer);
      expect(Buffer.from([1, 2, 3, 4]).equals(deserialized.nestedData.buffer as Buffer)).toBe(true);
      
      // Nested binary data in array
      expect(deserialized.nestedData.array[0]).toBeInstanceOf(Buffer);
      expect(Buffer.from('Array item', 'utf8').equals(deserialized.nestedData.array[0] as Buffer)).toBe(true);
    });

    it('should not process binary data when handleBinary is false', () => {
      const event = { data: Buffer.from('test buffer', 'utf8') };
      
      // Serialize without binary handling
      const serialized = serializeEvent(event, '1.0.0', { handleBinary: false });
      const parsed = JSON.parse(serialized);
      const parsedData = JSON.parse(parsed.data);
      
      // Buffer should be converted to object by JSON.stringify
      expect(typeof parsedData.data).toBe('object');
      expect(parsedData.data).not.toBeInstanceOf(Buffer);
      expect(parsedData.data).toHaveProperty('type');
      expect(parsedData.data).toHaveProperty('data');
      
      // Deserialize without binary handling
      const deserialized = deserializeEvent(serialized, { handleBinary: false });
      expect(deserialized.data).not.toBeInstanceOf(Buffer);
    });
  });

  describe('Journey Context Handling', () => {
    it('should add journey context during serialization', () => {
      const serialized = serializeJourneyEvent(journeyEvent, 'health');
      const deserialized = deserializeEvent(serialized);
      
      // Journey context should be added
      expect(deserialized).toHaveProperty('journey', 'health');
      expect(deserialized).toHaveProperty('metadata.journeyContext', 'health');
    });

    it('should preserve existing journey context', () => {
      const eventWithContext = {
        ...journeyEvent,
        journey: 'care',
        metadata: { journeyContext: 'care' }
      };
      
      const serialized = serializeJourneyEvent(eventWithContext, 'health');
      const deserialized = deserializeEvent(serialized);
      
      // Original journey context should be preserved
      expect(deserialized).toHaveProperty('journey', 'care');
      expect(deserialized).toHaveProperty('metadata.journeyContext', 'care');
    });

    it('should add journey context during deserialization', () => {
      const serialized = serializeEvent(journeyEvent);
      const deserialized = deserializeJourneyEvent(serialized, 'health');
      
      // Journey context should be added during deserialization
      expect(deserialized).toHaveProperty('journey', 'health');
      expect(deserialized).toHaveProperty('metadata.journeyContext', 'health');
    });

    it('should handle all journey types', () => {
      const journeys: Array<'health' | 'care' | 'plan'> = ['health', 'care', 'plan'];
      
      for (const journey of journeys) {
        const serialized = serializeJourneyEvent(journeyEvent, journey);
        const deserialized = deserializeEvent(serialized);
        
        expect(deserialized).toHaveProperty('journey', journey);
        expect(deserialized).toHaveProperty('metadata.journeyContext', journey);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw EventSerializationError on serialization failure', () => {
      // Create an object with circular reference
      const circular: any = { name: 'circular' };
      circular.self = circular;
      
      // Should throw when serializing
      expect(() => serializeEvent(circular)).toThrow(EventSerializationError);
      
      try {
        serializeEvent(circular);
      } catch (error) {
        // Verify error properties
        expect(error).toBeInstanceOf(EventSerializationError);
        expect(error.message).toContain('Failed to serialize event');
        expect(error.originalError).toBeDefined();
        expect(error.event).toBe(circular);
        expect(error.context).toHaveProperty('version');
        expect(error.context).toHaveProperty('options');
      }
    });

    it('should throw EventSerializationError on deserialization failure', () => {
      // Invalid JSON string
      const invalidJson = '{"version":"1.0.0","data":"invalid json"}';
      
      // Should throw when deserializing
      expect(() => deserializeEvent(invalidJson)).toThrow(EventSerializationError);
      
      try {
        deserializeEvent(invalidJson);
      } catch (error) {
        // Verify error properties
        expect(error).toBeInstanceOf(EventSerializationError);
        expect(error.message).toContain('Failed to deserialize event');
        expect(error.originalError).toBeDefined();
        expect(error.event).toBe(invalidJson);
        expect(error.context).toHaveProperty('options');
      }
    });

    it('should throw on validation errors', () => {
      // Missing version
      const missingVersion = JSON.stringify({ data: JSON.stringify(simpleEvent) });
      expect(() => deserializeEvent(missingVersion)).toThrow(/Missing event version/);
      
      // Missing data
      const missingData = JSON.stringify({ version: '1.0.0' });
      expect(() => deserializeEvent(missingData)).toThrow(/Missing event data/);
      
      // Should not throw when validation is disabled
      expect(() => deserializeEvent(missingVersion, { validate: false })).not.toThrow();
      expect(() => deserializeEvent(missingData, { validate: false })).not.toThrow();
    });

    it('should throw on unsupported versions', () => {
      const unsupportedVersion = '99.0.0';
      const serialized = serializeEvent(simpleEvent, unsupportedVersion);
      
      // Should throw by default
      expect(() => deserializeEvent(serialized)).toThrow(/Unsupported event version/);
      
      // Should not throw when allowUnknownVersion is true
      expect(() => deserializeEvent(serialized, { allowUnknownVersion: true })).not.toThrow();
    });
  });

  describe('Utility Functions', () => {
    it('should check if a version is supported', () => {
      // Supported versions
      expect(isVersionSupported('1.0.0')).toBe(true);
      expect(isVersionSupported('1.1.0')).toBe(true);
      expect(isVersionSupported('1.2.3')).toBe(true);
      
      // Unsupported versions
      expect(isVersionSupported('2.0.0')).toBe(false);
      expect(isVersionSupported('0.1.0')).toBe(false);
      expect(isVersionSupported('invalid')).toBe(false);
    });

    it('should extract event version from serialized event', () => {
      const version = '1.5.0';
      const serialized = serializeEvent(simpleEvent, version);
      
      expect(extractEventVersion(serialized)).toBe(version);
      
      // Should return null for invalid input
      expect(extractEventVersion('invalid')).toBeNull();
      expect(extractEventVersion('{}')).toBeNull();
    });

    it('should check if a string is a serialized event', () => {
      const serialized = serializeEvent(simpleEvent);
      
      // Valid serialized event
      expect(isSerializedEvent(serialized)).toBe(true);
      
      // Invalid inputs
      expect(isSerializedEvent('invalid')).toBe(false);
      expect(isSerializedEvent('{}')).toBe(false);
      expect(isSerializedEvent(JSON.stringify({ version: '1.0.0' }))).toBe(false);
      expect(isSerializedEvent(JSON.stringify({ data: 'test' }))).toBe(false);
      expect(isSerializedEvent(JSON.stringify({ version: 1, data: 'test' }))).toBe(false); // version must be string
      expect(isSerializedEvent(JSON.stringify({ version: '1.0.0', data: 123 }))).toBe(false); // data must be string
    });
  });

  describe('Schema Evolution and Backward Compatibility', () => {
    it('should handle schema evolution with backward compatibility', () => {
      // Original event schema (v1.0.0)
      const originalEvent = {
        id: 'event-123',
        type: 'user-action',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: {
          userId: 'user-456',
          action: 'login'
        }
      };
      
      // Serialize with original schema version
      const serializedV1 = serializeEvent(originalEvent, '1.0.0');
      
      // Evolve the schema (v1.1.0) - add new fields
      const evolvedEvent = {
        id: 'event-123',
        type: 'user-action',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: {
          userId: 'user-456',
          action: 'login',
          device: 'mobile', // New field
          location: { // New nested field
            country: 'Brazil',
            city: 'São Paulo'
          }
        },
        metadata: { // New field
          correlationId: 'corr-789'
        }
      };
      
      // Serialize with evolved schema version
      const serializedV1_1 = serializeEvent(evolvedEvent, '1.1.0');
      
      // Old code should be able to deserialize new events
      // (ignoring new fields it doesn't understand)
      const deserializedNewEventWithOldCode = deserializeEvent(serializedV1_1);
      expect(deserializedNewEventWithOldCode).toHaveProperty('id', 'event-123');
      expect(deserializedNewEventWithOldCode).toHaveProperty('data.userId', 'user-456');
      expect(deserializedNewEventWithOldCode).toHaveProperty('data.device', 'mobile');
      
      // New code should be able to deserialize old events
      // (with default values for missing fields)
      const deserializedOldEventWithNewCode = deserializeEvent(serializedV1);
      expect(deserializedOldEventWithNewCode).toHaveProperty('id', 'event-123');
      expect(deserializedOldEventWithNewCode).toHaveProperty('data.userId', 'user-456');
      expect(deserializedOldEventWithNewCode).not.toHaveProperty('data.device');
    });

    it('should handle renamed fields with custom transformation', () => {
      // Original event schema (v1.0.0)
      const originalEvent = {
        id: 'event-123',
        user_id: 'user-456', // Old field name
        action_type: 'login' // Old field name
      };
      
      // Serialize with original schema version
      const serializedV1 = serializeEvent(originalEvent, '1.0.0');
      
      // Deserialize and transform
      const deserialized = deserializeEvent(serializedV1);
      
      // Manual transformation (would be handled by a schema migration utility in real code)
      const transformed = {
        id: deserialized.id,
        userId: deserialized.user_id, // Transform to new field name
        actionType: deserialized.action_type, // Transform to new field name
      };
      
      expect(transformed).toHaveProperty('id', 'event-123');
      expect(transformed).toHaveProperty('userId', 'user-456');
      expect(transformed).toHaveProperty('actionType', 'login');
    });
  });

  describe('Performance Testing', () => {
    it('should handle large events efficiently', () => {
      // Create a large event with many properties
      const largeEvent: Record<string, unknown> = {
        id: 'large-event',
        timestamp: new Date().toISOString(),
        type: 'performance-test'
      };
      
      // Add 1000 properties
      for (let i = 0; i < 1000; i++) {
        largeEvent[`prop_${i}`] = `value_${i}`;
      }
      
      // Add nested objects
      largeEvent.nested = {};
      for (let i = 0; i < 100; i++) {
        (largeEvent.nested as Record<string, unknown>)[`nested_${i}`] = {
          id: `nested_${i}`,
          values: Array.from({ length: 10 }, (_, j) => `nested_value_${i}_${j}`)
        };
      }
      
      // Measure serialization time
      const startSerialize = performance.now();
      const serialized = serializeEvent(largeEvent);
      const serializeTime = performance.now() - startSerialize;
      
      // Measure deserialization time
      const startDeserialize = performance.now();
      const deserialized = deserializeEvent(serialized);
      const deserializeTime = performance.now() - startDeserialize;
      
      // Log performance metrics (these are not assertions, just informational)
      console.log(`Serialization time: ${serializeTime.toFixed(2)}ms`);
      console.log(`Deserialization time: ${deserializeTime.toFixed(2)}ms`);
      console.log(`Serialized size: ${serialized.length} bytes`);
      
      // Verify the result is correct
      expect(deserialized).toEqual(largeEvent);
    });
  });
});
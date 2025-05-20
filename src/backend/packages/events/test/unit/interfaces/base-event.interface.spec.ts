/**
 * @file base-event.interface.spec.ts
 * @description Unit tests for the BaseEvent interface that defines the core structure
 * for all events in the system. These tests ensure that the BaseEvent interface
 * correctly enforces required properties and type constraints.
 */

import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { EVENT_TYPES } from '../../../src/constants/event-types.constants';
import { SERVICES } from '../../../src/constants/services.constants';

describe('BaseEvent Interface', () => {
  // Define test data
  const mockEventId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTimestamp = new Date();
  const mockVersion = '1.0.0';
  const mockSource = SERVICES.HEALTH_SERVICE;
  const mockType = EVENT_TYPES.HEALTH.METRIC_RECORDED;
  const mockPayload = { userId: 'user123', metricType: 'HEART_RATE', value: 72 };
  const mockMetadata = { correlationId: 'corr-123', userId: 'user123' };
  
  // Helper function to create a valid BaseEvent
  const createValidBaseEvent = (): BaseEvent => ({
    eventId: mockEventId,
    timestamp: mockTimestamp,
    version: mockVersion,
    source: mockSource,
    type: mockType,
    payload: mockPayload,
    metadata: mockMetadata
  });

  describe('Structure Validation', () => {
    it('should create a valid BaseEvent with all required properties', () => {
      const event = createValidBaseEvent();
      
      expect(event.eventId).toBe(mockEventId);
      expect(event.timestamp).toBe(mockTimestamp);
      expect(event.version).toBe(mockVersion);
      expect(event.source).toBe(mockSource);
      expect(event.type).toBe(mockType);
      expect(event.payload).toEqual(mockPayload);
      expect(event.metadata).toEqual(mockMetadata);
    });

    it('should create a valid BaseEvent without optional metadata', () => {
      const event: BaseEvent = {
        eventId: mockEventId,
        timestamp: mockTimestamp,
        version: mockVersion,
        source: mockSource,
        type: mockType,
        payload: mockPayload
        // metadata is optional
      };
      
      expect(event.eventId).toBe(mockEventId);
      expect(event.timestamp).toBe(mockTimestamp);
      expect(event.version).toBe(mockVersion);
      expect(event.source).toBe(mockSource);
      expect(event.type).toBe(mockType);
      expect(event.payload).toEqual(mockPayload);
      expect(event.metadata).toBeUndefined();
    });

    it('should enforce required properties', () => {
      // @ts-expect-error - Testing missing required property 'eventId'
      const missingEventId: BaseEvent = {
        timestamp: mockTimestamp,
        version: mockVersion,
        source: mockSource,
        type: mockType,
        payload: mockPayload
      };

      // @ts-expect-error - Testing missing required property 'timestamp'
      const missingTimestamp: BaseEvent = {
        eventId: mockEventId,
        version: mockVersion,
        source: mockSource,
        type: mockType,
        payload: mockPayload
      };

      // @ts-expect-error - Testing missing required property 'version'
      const missingVersion: BaseEvent = {
        eventId: mockEventId,
        timestamp: mockTimestamp,
        source: mockSource,
        type: mockType,
        payload: mockPayload
      };

      // @ts-expect-error - Testing missing required property 'source'
      const missingSource: BaseEvent = {
        eventId: mockEventId,
        timestamp: mockTimestamp,
        version: mockVersion,
        type: mockType,
        payload: mockPayload
      };

      // @ts-expect-error - Testing missing required property 'type'
      const missingType: BaseEvent = {
        eventId: mockEventId,
        timestamp: mockTimestamp,
        version: mockVersion,
        source: mockSource,
        payload: mockPayload
      };

      // @ts-expect-error - Testing missing required property 'payload'
      const missingPayload: BaseEvent = {
        eventId: mockEventId,
        timestamp: mockTimestamp,
        version: mockVersion,
        source: mockSource,
        type: mockType
      };

      // These assertions will not be reached if TypeScript correctly flags the errors,
      // but they're included for runtime validation in case the types are bypassed
      expect(() => validateBaseEvent(missingEventId)).toThrow();
      expect(() => validateBaseEvent(missingTimestamp)).toThrow();
      expect(() => validateBaseEvent(missingVersion)).toThrow();
      expect(() => validateBaseEvent(missingSource)).toThrow();
      expect(() => validateBaseEvent(missingType)).toThrow();
      expect(() => validateBaseEvent(missingPayload)).toThrow();
    });

    it('should enforce property types', () => {
      // @ts-expect-error - Testing invalid type for 'eventId'
      const invalidEventId: BaseEvent = {
        ...createValidBaseEvent(),
        eventId: 123 // Should be string
      };

      // @ts-expect-error - Testing invalid type for 'timestamp'
      const invalidTimestamp: BaseEvent = {
        ...createValidBaseEvent(),
        timestamp: '2023-01-01' // Should be Date
      };

      // @ts-expect-error - Testing invalid type for 'version'
      const invalidVersion: BaseEvent = {
        ...createValidBaseEvent(),
        version: 1 // Should be string
      };

      // @ts-expect-error - Testing invalid type for 'source'
      const invalidSource: BaseEvent = {
        ...createValidBaseEvent(),
        source: 123 // Should be string
      };

      // @ts-expect-error - Testing invalid type for 'type'
      const invalidType: BaseEvent = {
        ...createValidBaseEvent(),
        type: 123 // Should be string
      };

      // @ts-expect-error - Testing invalid type for 'payload'
      const invalidPayload: BaseEvent = {
        ...createValidBaseEvent(),
        payload: 'not an object' // Should be object
      };

      // @ts-expect-error - Testing invalid type for 'metadata'
      const invalidMetadata: BaseEvent = {
        ...createValidBaseEvent(),
        metadata: 'not an object' // Should be object
      };

      // These assertions will not be reached if TypeScript correctly flags the errors,
      // but they're included for runtime validation in case the types are bypassed
      expect(() => validateBaseEvent(invalidEventId)).toThrow();
      expect(() => validateBaseEvent(invalidTimestamp)).toThrow();
      expect(() => validateBaseEvent(invalidVersion)).toThrow();
      expect(() => validateBaseEvent(invalidSource)).toThrow();
      expect(() => validateBaseEvent(invalidType)).toThrow();
      expect(() => validateBaseEvent(invalidPayload)).toThrow();
      expect(() => validateBaseEvent(invalidMetadata)).toThrow();
    });
  });

  describe('Serialization/Deserialization', () => {
    it('should serialize to JSON correctly', () => {
      const event = createValidBaseEvent();
      const serialized = JSON.stringify(event);
      
      expect(serialized).toBeTruthy();
      expect(typeof serialized).toBe('string');
      
      const deserialized = JSON.parse(serialized);
      expect(deserialized.eventId).toBe(mockEventId);
      expect(deserialized.version).toBe(mockVersion);
      expect(deserialized.source).toBe(mockSource);
      expect(deserialized.type).toBe(mockType);
      expect(deserialized.payload).toEqual(mockPayload);
      expect(deserialized.metadata).toEqual(mockMetadata);
    });

    it('should handle Date serialization/deserialization', () => {
      const event = createValidBaseEvent();
      const serialized = JSON.stringify(event);
      const deserialized = JSON.parse(serialized);
      
      // Date is serialized as a string
      expect(typeof deserialized.timestamp).toBe('string');
      
      // Convert back to Date for comparison
      const deserializedDate = new Date(deserialized.timestamp);
      expect(deserializedDate.getTime()).toBe(mockTimestamp.getTime());
    });

    it('should preserve types when using BaseEvent.fromJSON', () => {
      const event = createValidBaseEvent();
      const serialized = JSON.stringify(event);
      const deserialized = BaseEvent.fromJSON(serialized);
      
      expect(deserialized.eventId).toBe(mockEventId);
      expect(deserialized.timestamp).toBeInstanceOf(Date);
      expect(deserialized.timestamp.getTime()).toBe(mockTimestamp.getTime());
      expect(deserialized.version).toBe(mockVersion);
      expect(deserialized.source).toBe(mockSource);
      expect(deserialized.type).toBe(mockType);
      expect(deserialized.payload).toEqual(mockPayload);
      expect(deserialized.metadata).toEqual(mockMetadata);
    });

    it('should throw an error when deserializing invalid JSON', () => {
      expect(() => {
        BaseEvent.fromJSON('invalid-json');
      }).toThrow('Failed to parse event JSON: invalid JSON');
    });

    it('should throw an error when deserializing an object missing required fields', () => {
      const invalidJson = JSON.stringify({ type: mockType, payload: mockPayload }); // Missing most fields
      
      expect(() => {
        BaseEvent.fromJSON(invalidJson);
      }).toThrow('Invalid event format: missing required fields');
    });
  });

  describe('Validation', () => {
    it('should validate a valid BaseEvent', () => {
      const event = createValidBaseEvent();
      expect(BaseEvent.validate(event)).toBe(true);
    });

    it('should validate eventId format (UUID)', () => {
      const invalidEvent = {
        ...createValidBaseEvent(),
        eventId: 'not-a-uuid'
      };
      
      expect(() => BaseEvent.validate(invalidEvent)).toThrow(
        'Invalid eventId: must be a valid UUID'
      );
    });

    it('should validate timestamp is a valid Date', () => {
      const invalidEvent = {
        ...createValidBaseEvent(),
        timestamp: new Date('invalid-date')
      };
      
      expect(() => BaseEvent.validate(invalidEvent)).toThrow(
        'Invalid timestamp: must be a valid Date'
      );
    });

    it('should validate version follows semantic versioning', () => {
      const invalidEvent = {
        ...createValidBaseEvent(),
        version: 'not-semver'
      };
      
      expect(() => BaseEvent.validate(invalidEvent)).toThrow(
        'Invalid version: must follow semantic versioning (x.y.z)'
      );
    });

    it('should validate source is a known service', () => {
      const invalidEvent = {
        ...createValidBaseEvent(),
        source: 'unknown-service'
      };
      
      expect(() => BaseEvent.validate(invalidEvent)).toThrow(
        'Invalid source: must be a known service'
      );
    });

    it('should validate type is a known event type', () => {
      const invalidEvent = {
        ...createValidBaseEvent(),
        type: 'unknown.event.type'
      };
      
      expect(() => BaseEvent.validate(invalidEvent)).toThrow(
        'Invalid type: must be a known event type'
      );
    });

    it('should validate payload is an object', () => {
      const invalidEvent = {
        ...createValidBaseEvent(),
        payload: null
      };
      
      expect(() => BaseEvent.validate(invalidEvent)).toThrow(
        'Invalid payload: must be a non-null object'
      );
    });
  });

  describe('Metadata Handling', () => {
    it('should allow metadata to be undefined', () => {
      const event: BaseEvent = {
        eventId: mockEventId,
        timestamp: mockTimestamp,
        version: mockVersion,
        source: mockSource,
        type: mockType,
        payload: mockPayload
      };
      
      expect(BaseEvent.validate(event)).toBe(true);
    });

    it('should validate metadata is an object when provided', () => {
      const invalidEvent = {
        ...createValidBaseEvent(),
        metadata: null
      };
      
      expect(() => BaseEvent.validate(invalidEvent)).toThrow(
        'Invalid metadata: must be an object when provided'
      );
    });

    it('should be compatible with EventMetadataDto', () => {
      // Create an EventMetadataDto instance
      const eventMetadata = new EventMetadataDto({
        correlationId: 'corr-123',
        origin: {
          service: SERVICES.HEALTH_SERVICE,
          component: 'metric-processor'
        },
        userId: 'user123'
      });

      const event: BaseEvent = {
        eventId: mockEventId,
        timestamp: mockTimestamp,
        version: mockVersion,
        source: mockSource,
        type: mockType,
        payload: mockPayload,
        metadata: eventMetadata
      };
      
      expect(BaseEvent.validate(event)).toBe(true);
      expect(event.metadata?.correlationId).toBe('corr-123');
      expect(event.metadata?.origin?.service).toBe(SERVICES.HEALTH_SERVICE);
      expect(event.metadata?.userId).toBe('user123');
    });

    it('should support journey-specific metadata extensions', () => {
      // Health journey specific metadata
      const healthEvent: BaseEvent = {
        ...createValidBaseEvent(),
        type: EVENT_TYPES.HEALTH.METRIC_RECORDED,
        metadata: {
          ...mockMetadata,
          deviceId: 'device123',
          metricType: 'HEART_RATE'
        }
      };
      
      // Care journey specific metadata
      const careEvent: BaseEvent = {
        ...createValidBaseEvent(),
        type: EVENT_TYPES.CARE.APPOINTMENT_BOOKED,
        metadata: {
          ...mockMetadata,
          providerId: 'provider123',
          specialtyId: 'cardiology'
        }
      };
      
      // Plan journey specific metadata
      const planEvent: BaseEvent = {
        ...createValidBaseEvent(),
        type: EVENT_TYPES.PLAN.CLAIM_SUBMITTED,
        metadata: {
          ...mockMetadata,
          claimId: 'claim123',
          planId: 'plan123'
        }
      };
      
      expect(BaseEvent.validate(healthEvent)).toBe(true);
      expect(BaseEvent.validate(careEvent)).toBe(true);
      expect(BaseEvent.validate(planEvent)).toBe(true);
      
      expect(healthEvent.metadata?.deviceId).toBe('device123');
      expect(careEvent.metadata?.providerId).toBe('provider123');
      expect(planEvent.metadata?.claimId).toBe('claim123');
    });
  });

  describe('Event Creation', () => {
    it('should create a new event with BaseEvent.create', () => {
      const event = BaseEvent.create({
        source: mockSource,
        type: mockType,
        payload: mockPayload,
        metadata: mockMetadata
      });
      
      // eventId should be auto-generated
      expect(event.eventId).toBeTruthy();
      expect(typeof event.eventId).toBe('string');
      
      // timestamp should be current time
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(Date.now() - event.timestamp.getTime()).toBeLessThan(1000); // Within last second
      
      // version should be set to default
      expect(event.version).toBe('1.0.0');
      
      // Other properties should match input
      expect(event.source).toBe(mockSource);
      expect(event.type).toBe(mockType);
      expect(event.payload).toEqual(mockPayload);
      expect(event.metadata).toEqual(mockMetadata);
    });

    it('should allow overriding auto-generated fields', () => {
      const customEventId = '00000000-0000-0000-0000-000000000000';
      const customTimestamp = new Date('2023-01-01T00:00:00Z');
      const customVersion = '2.0.0';
      
      const event = BaseEvent.create({
        eventId: customEventId,
        timestamp: customTimestamp,
        version: customVersion,
        source: mockSource,
        type: mockType,
        payload: mockPayload
      });
      
      expect(event.eventId).toBe(customEventId);
      expect(event.timestamp).toBe(customTimestamp);
      expect(event.version).toBe(customVersion);
    });

    it('should generate a unique eventId for each event', () => {
      const event1 = BaseEvent.create({
        source: mockSource,
        type: mockType,
        payload: mockPayload
      });
      
      const event2 = BaseEvent.create({
        source: mockSource,
        type: mockType,
        payload: mockPayload
      });
      
      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });
});

/**
 * Helper function to validate a BaseEvent at runtime.
 * This is used in tests to verify that the interface constraints are enforced.
 */
function validateBaseEvent(event: BaseEvent): void {
  if (!event.eventId) {
    throw new Error('BaseEvent must have an eventId property');
  }
  
  if (!event.timestamp) {
    throw new Error('BaseEvent must have a timestamp property');
  }
  
  if (!event.version) {
    throw new Error('BaseEvent must have a version property');
  }
  
  if (!event.source) {
    throw new Error('BaseEvent must have a source property');
  }
  
  if (!event.type) {
    throw new Error('BaseEvent must have a type property');
  }
  
  if (!event.payload) {
    throw new Error('BaseEvent must have a payload property');
  }
  
  if (typeof event.eventId !== 'string') {
    throw new Error('BaseEvent.eventId must be a string');
  }
  
  if (!(event.timestamp instanceof Date)) {
    throw new Error('BaseEvent.timestamp must be a Date');
  }
  
  if (typeof event.version !== 'string') {
    throw new Error('BaseEvent.version must be a string');
  }
  
  if (typeof event.source !== 'string') {
    throw new Error('BaseEvent.source must be a string');
  }
  
  if (typeof event.type !== 'string') {
    throw new Error('BaseEvent.type must be a string');
  }
  
  if (typeof event.payload !== 'object' || event.payload === null) {
    throw new Error('BaseEvent.payload must be a non-null object');
  }
  
  if (event.metadata !== undefined && (typeof event.metadata !== 'object' || event.metadata === null)) {
    throw new Error('BaseEvent.metadata must be an object when provided');
  }
}
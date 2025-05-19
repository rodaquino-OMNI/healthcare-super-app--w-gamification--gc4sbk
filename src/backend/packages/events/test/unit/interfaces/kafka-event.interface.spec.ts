import { KafkaEvent } from '../../../src/interfaces/kafka-event.interface';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

describe('KafkaEvent Interface', () => {
  // Mock data for testing
  const mockEventId = uuidv4();
  const mockTimestamp = new Date().toISOString();
  const mockTopic = 'test-topic';
  const mockPartition = 0;
  const mockOffset = '100';
  const mockKey = 'test-key';
  const mockHeaders = { correlationId: 'test-correlation-id', source: 'test-service' };
  
  // Mock payload for testing
  const mockPayload = {
    userId: 'user-123',
    action: 'test-action',
    data: { value: 'test-value' }
  };

  // Mock base event for testing
  const mockBaseEvent: BaseEvent<any> = {
    eventId: mockEventId,
    timestamp: mockTimestamp,
    version: '1.0.0',
    source: 'test-service',
    type: 'test-event',
    payload: mockPayload,
    metadata: {
      correlationId: 'test-correlation-id',
      userId: 'user-123'
    }
  };

  // Mock Kafka message for testing
  const mockKafkaMessage: KafkaMessage = {
    key: Buffer.from(mockKey),
    value: Buffer.from(JSON.stringify(mockBaseEvent)),
    timestamp: mockTimestamp,
    size: 0,
    attributes: 0,
    offset: mockOffset,
    headers: {
      correlationId: Buffer.from('test-correlation-id'),
      source: Buffer.from('test-service')
    }
  };

  describe('KafkaEvent Properties', () => {
    it('should extend BaseEvent with Kafka-specific properties', () => {
      // Create a KafkaEvent instance
      const kafkaEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic,
        partition: mockPartition,
        offset: mockOffset,
        key: mockKey,
        headers: mockHeaders
      });

      // Verify BaseEvent properties
      expect(kafkaEvent.eventId).toBe(mockEventId);
      expect(kafkaEvent.timestamp).toBe(mockTimestamp);
      expect(kafkaEvent.version).toBe('1.0.0');
      expect(kafkaEvent.source).toBe('test-service');
      expect(kafkaEvent.type).toBe('test-event');
      expect(kafkaEvent.payload).toEqual(mockPayload);
      expect(kafkaEvent.metadata).toEqual({
        correlationId: 'test-correlation-id',
        userId: 'user-123'
      });

      // Verify Kafka-specific properties
      expect(kafkaEvent.topic).toBe(mockTopic);
      expect(kafkaEvent.partition).toBe(mockPartition);
      expect(kafkaEvent.offset).toBe(mockOffset);
      expect(kafkaEvent.key).toBe(mockKey);
      expect(kafkaEvent.headers).toEqual(mockHeaders);
    });

    it('should handle undefined Kafka-specific properties', () => {
      // Create a KafkaEvent instance with minimal properties
      const kafkaEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic
      });

      // Verify Kafka-specific properties with defaults
      expect(kafkaEvent.topic).toBe(mockTopic);
      expect(kafkaEvent.partition).toBeUndefined();
      expect(kafkaEvent.offset).toBeUndefined();
      expect(kafkaEvent.key).toBeUndefined();
      expect(kafkaEvent.headers).toEqual({});
    });
  });

  describe('KafkaEvent.fromKafkaMessage', () => {
    it('should create a KafkaEvent from a Kafka message', () => {
      // Create a KafkaEvent from a Kafka message
      const kafkaEvent = KafkaEvent.fromKafkaMessage(mockKafkaMessage, mockTopic, mockPartition);

      // Verify BaseEvent properties
      expect(kafkaEvent.eventId).toBe(mockEventId);
      expect(kafkaEvent.timestamp).toBe(mockTimestamp);
      expect(kafkaEvent.version).toBe('1.0.0');
      expect(kafkaEvent.source).toBe('test-service');
      expect(kafkaEvent.type).toBe('test-event');
      expect(kafkaEvent.payload).toEqual(mockPayload);
      expect(kafkaEvent.metadata).toEqual({
        correlationId: 'test-correlation-id',
        userId: 'user-123'
      });

      // Verify Kafka-specific properties
      expect(kafkaEvent.topic).toBe(mockTopic);
      expect(kafkaEvent.partition).toBe(mockPartition);
      expect(kafkaEvent.offset).toBe(mockOffset);
      expect(kafkaEvent.key).toBe(mockKey);
      expect(kafkaEvent.headers).toEqual({
        correlationId: 'test-correlation-id',
        source: 'test-service'
      });
    });

    it('should handle Kafka message with missing or invalid value', () => {
      // Create a Kafka message with missing value
      const invalidKafkaMessage: KafkaMessage = {
        ...mockKafkaMessage,
        value: null
      };

      // Expect error when creating KafkaEvent from invalid message
      expect(() => {
        KafkaEvent.fromKafkaMessage(invalidKafkaMessage, mockTopic, mockPartition);
      }).toThrow('Failed to deserialize Kafka message: message value is null or invalid');
    });

    it('should handle Kafka message with invalid JSON', () => {
      // Create a Kafka message with invalid JSON
      const invalidJsonMessage: KafkaMessage = {
        ...mockKafkaMessage,
        value: Buffer.from('invalid-json')
      };

      // Expect error when creating KafkaEvent from invalid JSON
      expect(() => {
        KafkaEvent.fromKafkaMessage(invalidJsonMessage, mockTopic, mockPartition);
      }).toThrow('Failed to deserialize Kafka message');
    });
  });

  describe('KafkaEvent.toKafkaMessage', () => {
    it('should convert a KafkaEvent to a Kafka message', () => {
      // Create a KafkaEvent instance
      const kafkaEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic,
        partition: mockPartition,
        offset: mockOffset,
        key: mockKey,
        headers: mockHeaders
      });

      // Convert to Kafka message
      const kafkaMessage = kafkaEvent.toKafkaMessage();

      // Verify Kafka message properties
      expect(kafkaMessage.key?.toString()).toBe(mockKey);
      expect(JSON.parse(kafkaMessage.value?.toString() || '{}')).toEqual(mockBaseEvent);
      expect(kafkaMessage.headers).toBeDefined();
      
      if (kafkaMessage.headers) {
        expect(kafkaMessage.headers.correlationId?.toString()).toBe('test-correlation-id');
        expect(kafkaMessage.headers.source?.toString()).toBe('test-service');
      }
    });

    it('should handle KafkaEvent with missing key', () => {
      // Create a KafkaEvent instance without key
      const kafkaEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic,
        partition: mockPartition,
        offset: mockOffset,
        headers: mockHeaders
      });

      // Convert to Kafka message
      const kafkaMessage = kafkaEvent.toKafkaMessage();

      // Verify Kafka message properties
      expect(kafkaMessage.key).toBeUndefined();
      expect(JSON.parse(kafkaMessage.value?.toString() || '{}')).toEqual(mockBaseEvent);
    });

    it('should handle KafkaEvent with missing headers', () => {
      // Create a KafkaEvent instance without headers
      const kafkaEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic,
        partition: mockPartition,
        offset: mockOffset,
        key: mockKey
      });

      // Convert to Kafka message
      const kafkaMessage = kafkaEvent.toKafkaMessage();

      // Verify Kafka message properties
      expect(kafkaMessage.key?.toString()).toBe(mockKey);
      expect(JSON.parse(kafkaMessage.value?.toString() || '{}')).toEqual(mockBaseEvent);
      expect(kafkaMessage.headers).toEqual({});
    });
  });

  describe('KafkaEvent Headers Validation', () => {
    it('should validate required headers', () => {
      // Create a KafkaEvent instance with required headers
      const kafkaEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic,
        headers: {
          correlationId: 'test-correlation-id',
          source: 'test-service'
        }
      });

      // Verify headers validation
      expect(kafkaEvent.validateHeaders()).toBe(true);
    });

    it('should fail validation with missing required headers', () => {
      // Create a KafkaEvent instance with missing required headers
      const kafkaEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic,
        headers: {
          // Missing correlationId
          source: 'test-service'
        }
      });

      // Verify headers validation fails
      expect(kafkaEvent.validateHeaders()).toBe(false);
    });

    it('should validate custom headers', () => {
      // Create a KafkaEvent instance with custom headers
      const kafkaEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic,
        headers: {
          correlationId: 'test-correlation-id',
          source: 'test-service',
          customHeader: 'custom-value'
        }
      });

      // Verify custom headers validation
      expect(kafkaEvent.validateHeaders(['correlationId', 'source', 'customHeader'])).toBe(true);
      expect(kafkaEvent.validateHeaders(['correlationId', 'source', 'missingHeader'])).toBe(false);
    });
  });

  describe('KafkaEvent Serialization/Deserialization', () => {
    it('should serialize and deserialize a KafkaEvent correctly', () => {
      // Create a KafkaEvent instance
      const originalEvent = new KafkaEvent({
        ...mockBaseEvent,
        topic: mockTopic,
        partition: mockPartition,
        offset: mockOffset,
        key: mockKey,
        headers: mockHeaders
      });

      // Serialize to JSON
      const serialized = JSON.stringify(originalEvent);

      // Deserialize from JSON
      const deserialized = JSON.parse(serialized);

      // Create a new KafkaEvent from deserialized data
      const recreatedEvent = new KafkaEvent(deserialized);

      // Verify all properties match
      expect(recreatedEvent.eventId).toBe(originalEvent.eventId);
      expect(recreatedEvent.timestamp).toBe(originalEvent.timestamp);
      expect(recreatedEvent.version).toBe(originalEvent.version);
      expect(recreatedEvent.source).toBe(originalEvent.source);
      expect(recreatedEvent.type).toBe(originalEvent.type);
      expect(recreatedEvent.payload).toEqual(originalEvent.payload);
      expect(recreatedEvent.metadata).toEqual(originalEvent.metadata);
      expect(recreatedEvent.topic).toBe(originalEvent.topic);
      expect(recreatedEvent.partition).toBe(originalEvent.partition);
      expect(recreatedEvent.offset).toBe(originalEvent.offset);
      expect(recreatedEvent.key).toBe(originalEvent.key);
      expect(recreatedEvent.headers).toEqual(originalEvent.headers);
    });
  });

  describe('KafkaEvent with Journey-Specific Events', () => {
    // Health journey event
    const healthEvent: BaseEvent<any> = {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'health-service',
      type: 'health.metrics.recorded',
      payload: {
        userId: 'user-123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date().toISOString()
      },
      metadata: {
        correlationId: uuidv4(),
        userId: 'user-123',
        journey: 'health'
      }
    };

    // Care journey event
    const careEvent: BaseEvent<any> = {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'care-service',
      type: 'care.appointment.booked',
      payload: {
        userId: 'user-123',
        appointmentId: 'appointment-123',
        providerId: 'provider-123',
        specialtyId: 'specialty-123',
        scheduledAt: new Date(Date.now() + 86400000).toISOString() // Tomorrow
      },
      metadata: {
        correlationId: uuidv4(),
        userId: 'user-123',
        journey: 'care'
      }
    };

    // Plan journey event
    const planEvent: BaseEvent<any> = {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'plan-service',
      type: 'plan.claim.submitted',
      payload: {
        userId: 'user-123',
        claimId: 'claim-123',
        claimType: 'medical',
        amount: 150.75,
        currency: 'BRL',
        submittedAt: new Date().toISOString()
      },
      metadata: {
        correlationId: uuidv4(),
        userId: 'user-123',
        journey: 'plan'
      }
    };

    it('should handle Health journey events', () => {
      // Create a KafkaEvent for health journey
      const kafkaEvent = new KafkaEvent({
        ...healthEvent,
        topic: 'health-events',
        partition: 0,
        offset: '200',
        key: 'user-123',
        headers: {
          correlationId: healthEvent.metadata.correlationId,
          source: healthEvent.source,
          journey: 'health'
        }
      });

      // Verify journey-specific properties
      expect(kafkaEvent.topic).toBe('health-events');
      expect(kafkaEvent.headers.journey).toBe('health');
      expect(kafkaEvent.type).toBe('health.metrics.recorded');
      expect(kafkaEvent.payload.metricType).toBe('HEART_RATE');
    });

    it('should handle Care journey events', () => {
      // Create a KafkaEvent for care journey
      const kafkaEvent = new KafkaEvent({
        ...careEvent,
        topic: 'care-events',
        partition: 0,
        offset: '300',
        key: 'user-123',
        headers: {
          correlationId: careEvent.metadata.correlationId,
          source: careEvent.source,
          journey: 'care'
        }
      });

      // Verify journey-specific properties
      expect(kafkaEvent.topic).toBe('care-events');
      expect(kafkaEvent.headers.journey).toBe('care');
      expect(kafkaEvent.type).toBe('care.appointment.booked');
      expect(kafkaEvent.payload.appointmentId).toBe('appointment-123');
    });

    it('should handle Plan journey events', () => {
      // Create a KafkaEvent for plan journey
      const kafkaEvent = new KafkaEvent({
        ...planEvent,
        topic: 'plan-events',
        partition: 0,
        offset: '400',
        key: 'user-123',
        headers: {
          correlationId: planEvent.metadata.correlationId,
          source: planEvent.source,
          journey: 'plan'
        }
      });

      // Verify journey-specific properties
      expect(kafkaEvent.topic).toBe('plan-events');
      expect(kafkaEvent.headers.journey).toBe('plan');
      expect(kafkaEvent.type).toBe('plan.claim.submitted');
      expect(kafkaEvent.payload.claimId).toBe('claim-123');
    });
  });
});
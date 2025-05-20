import { Test } from '@nestjs/testing';
import { KafkaMessage } from 'kafkajs';

// Import the interfaces we're testing
import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { KafkaEvent } from '../../../src/interfaces/kafka-event.interface';

describe('KafkaEvent Interface', () => {
  // Define test data
  const mockEventId = 'test-event-123';
  const mockTimestamp = new Date();
  const mockVersion = '1.0.0';
  const mockSource = 'test-service';
  const mockType = 'test.event';
  const mockPayload = { data: 'test-data' };
  const mockMetadata = { correlationId: 'corr-123' };
  
  // Kafka-specific properties
  const mockTopic = 'test-topic';
  const mockPartition = 1;
  const mockOffset = '100';
  const mockHeaders = { 'content-type': 'application/json' };
  const mockKey = 'test-key';
  
  // Create a base event for testing
  const createBaseEvent = (): BaseEvent => ({
    eventId: mockEventId,
    timestamp: mockTimestamp,
    version: mockVersion,
    source: mockSource,
    type: mockType,
    payload: mockPayload,
    metadata: mockMetadata,
  });
  
  // Create a Kafka event for testing
  const createKafkaEvent = (): KafkaEvent => ({
    ...createBaseEvent(),
    topic: mockTopic,
    partition: mockPartition,
    offset: mockOffset,
    headers: mockHeaders,
    key: mockKey,
  });
  
  // Create a Kafka message for testing
  const createKafkaMessage = (): KafkaMessage => ({
    key: Buffer.from(mockKey),
    value: Buffer.from(JSON.stringify({
      eventId: mockEventId,
      timestamp: mockTimestamp.toISOString(),
      version: mockVersion,
      source: mockSource,
      type: mockType,
      payload: mockPayload,
      metadata: mockMetadata,
    })),
    timestamp: mockTimestamp.getTime().toString(),
    size: 0,
    attributes: 0,
    offset: mockOffset,
    headers: {
      'content-type': Buffer.from('application/json'),
    },
  });

  describe('Interface Structure', () => {
    it('should extend BaseEvent with Kafka-specific properties', () => {
      const kafkaEvent = createKafkaEvent();
      
      // Verify BaseEvent properties
      expect(kafkaEvent.eventId).toBe(mockEventId);
      expect(kafkaEvent.timestamp).toBe(mockTimestamp);
      expect(kafkaEvent.version).toBe(mockVersion);
      expect(kafkaEvent.source).toBe(mockSource);
      expect(kafkaEvent.type).toBe(mockType);
      expect(kafkaEvent.payload).toEqual(mockPayload);
      expect(kafkaEvent.metadata).toEqual(mockMetadata);
      
      // Verify Kafka-specific properties
      expect(kafkaEvent.topic).toBe(mockTopic);
      expect(kafkaEvent.partition).toBe(mockPartition);
      expect(kafkaEvent.offset).toBe(mockOffset);
      expect(kafkaEvent.headers).toEqual(mockHeaders);
      expect(kafkaEvent.key).toBe(mockKey);
    });
  });

  describe('Conversion Methods', () => {
    describe('fromKafkaMessage', () => {
      it('should convert a KafkaMessage to a KafkaEvent', () => {
        const kafkaMessage = createKafkaMessage();
        const kafkaEvent = KafkaEvent.fromKafkaMessage(kafkaMessage, mockTopic, mockPartition);
        
        // Verify BaseEvent properties
        expect(kafkaEvent.eventId).toBe(mockEventId);
        expect(kafkaEvent.timestamp).toEqual(new Date(mockTimestamp.toISOString()));
        expect(kafkaEvent.version).toBe(mockVersion);
        expect(kafkaEvent.source).toBe(mockSource);
        expect(kafkaEvent.type).toBe(mockType);
        expect(kafkaEvent.payload).toEqual(mockPayload);
        expect(kafkaEvent.metadata).toEqual(mockMetadata);
        
        // Verify Kafka-specific properties
        expect(kafkaEvent.topic).toBe(mockTopic);
        expect(kafkaEvent.partition).toBe(mockPartition);
        expect(kafkaEvent.offset).toBe(mockOffset);
        expect(kafkaEvent.headers).toEqual({ 'content-type': 'application/json' });
        expect(kafkaEvent.key).toBe(mockKey);
      });

      it('should handle missing or null message value', () => {
        const kafkaMessage: KafkaMessage = {
          ...createKafkaMessage(),
          value: null,
        };
        
        expect(() => {
          KafkaEvent.fromKafkaMessage(kafkaMessage, mockTopic, mockPartition);
        }).toThrow('Invalid Kafka message: message value is null or undefined');
      });

      it('should handle invalid JSON in message value', () => {
        const kafkaMessage: KafkaMessage = {
          ...createKafkaMessage(),
          value: Buffer.from('invalid-json'),
        };
        
        expect(() => {
          KafkaEvent.fromKafkaMessage(kafkaMessage, mockTopic, mockPartition);
        }).toThrow('Failed to parse Kafka message value as JSON');
      });

      it('should handle missing required fields in message value', () => {
        const kafkaMessage: KafkaMessage = {
          ...createKafkaMessage(),
          value: Buffer.from(JSON.stringify({ 
            // Missing eventId and other required fields
            payload: mockPayload 
          })),
        };
        
        expect(() => {
          KafkaEvent.fromKafkaMessage(kafkaMessage, mockTopic, mockPartition);
        }).toThrow('Invalid event format: missing required fields');
      });
    });

    describe('toKafkaMessage', () => {
      it('should convert a KafkaEvent to a KafkaMessage', () => {
        const kafkaEvent = createKafkaEvent();
        const kafkaMessage = KafkaEvent.toKafkaMessage(kafkaEvent);
        
        // Verify the message key
        expect(kafkaMessage.key).toBeInstanceOf(Buffer);
        expect(kafkaMessage.key.toString()).toBe(mockKey);
        
        // Verify the message value
        expect(kafkaMessage.value).toBeInstanceOf(Buffer);
        const parsedValue = JSON.parse(kafkaMessage.value.toString());
        expect(parsedValue.eventId).toBe(mockEventId);
        expect(parsedValue.timestamp).toBe(mockTimestamp.toISOString());
        expect(parsedValue.version).toBe(mockVersion);
        expect(parsedValue.source).toBe(mockSource);
        expect(parsedValue.type).toBe(mockType);
        expect(parsedValue.payload).toEqual(mockPayload);
        expect(parsedValue.metadata).toEqual(mockMetadata);
        
        // Verify headers
        expect(kafkaMessage.headers).toBeDefined();
        expect(kafkaMessage.headers['content-type']).toBeInstanceOf(Buffer);
        expect(kafkaMessage.headers['content-type'].toString()).toBe('application/json');
      });

      it('should handle events without a key', () => {
        const kafkaEvent = { ...createKafkaEvent(), key: undefined };
        const kafkaMessage = KafkaEvent.toKafkaMessage(kafkaEvent);
        
        // Key should be null when not provided
        expect(kafkaMessage.key).toBeNull();
      });

      it('should handle events without headers', () => {
        const kafkaEvent = { ...createKafkaEvent(), headers: undefined };
        const kafkaMessage = KafkaEvent.toKafkaMessage(kafkaEvent);
        
        // Should have default content-type header
        expect(kafkaMessage.headers).toBeDefined();
        expect(kafkaMessage.headers['content-type']).toBeInstanceOf(Buffer);
        expect(kafkaMessage.headers['content-type'].toString()).toBe('application/json');
      });
    });
  });

  describe('Validation', () => {
    it('should validate a valid KafkaEvent', () => {
      const kafkaEvent = createKafkaEvent();
      expect(KafkaEvent.validate(kafkaEvent)).toBe(true);
    });

    it('should reject events missing BaseEvent properties', () => {
      const invalidEvent = { 
        ...createKafkaEvent(),
        eventId: undefined, // Missing required field
      };
      
      expect(() => KafkaEvent.validate(invalidEvent)).toThrow(
        'Invalid KafkaEvent: missing required BaseEvent property "eventId"'
      );
    });

    it('should reject events missing Kafka-specific properties', () => {
      const invalidEvent = { 
        ...createKafkaEvent(),
        topic: undefined, // Missing required Kafka field
      };
      
      expect(() => KafkaEvent.validate(invalidEvent)).toThrow(
        'Invalid KafkaEvent: missing required Kafka property "topic"'
      );
    });

    it('should validate headers format', () => {
      const invalidEvent = { 
        ...createKafkaEvent(),
        headers: { 'content-type': 123 }, // Invalid header value type
      };
      
      expect(() => KafkaEvent.validate(invalidEvent)).toThrow(
        'Invalid KafkaEvent: header values must be strings'
      );
    });
  });

  describe('Serialization/Deserialization', () => {
    it('should serialize and deserialize a KafkaEvent correctly', () => {
      const originalEvent = createKafkaEvent();
      
      // Serialize to string
      const serialized = KafkaEvent.serialize(originalEvent);
      expect(typeof serialized).toBe('string');
      
      // Deserialize back to object
      const deserialized = KafkaEvent.deserialize(serialized);
      
      // Verify all properties match
      expect(deserialized.eventId).toBe(originalEvent.eventId);
      expect(deserialized.timestamp).toEqual(originalEvent.timestamp);
      expect(deserialized.version).toBe(originalEvent.version);
      expect(deserialized.source).toBe(originalEvent.source);
      expect(deserialized.type).toBe(originalEvent.type);
      expect(deserialized.payload).toEqual(originalEvent.payload);
      expect(deserialized.metadata).toEqual(originalEvent.metadata);
      expect(deserialized.topic).toBe(originalEvent.topic);
      expect(deserialized.partition).toBe(originalEvent.partition);
      expect(deserialized.offset).toBe(originalEvent.offset);
      expect(deserialized.headers).toEqual(originalEvent.headers);
      expect(deserialized.key).toBe(originalEvent.key);
    });

    it('should handle Date objects correctly during serialization', () => {
      const originalEvent = createKafkaEvent();
      
      // Serialize to string
      const serialized = KafkaEvent.serialize(originalEvent);
      
      // Deserialize back to object
      const deserialized = KafkaEvent.deserialize(serialized);
      
      // Verify timestamp is a Date object with the same value
      expect(deserialized.timestamp).toBeInstanceOf(Date);
      expect(deserialized.timestamp.getTime()).toBe(originalEvent.timestamp.getTime());
    });

    it('should throw an error when deserializing invalid JSON', () => {
      expect(() => {
        KafkaEvent.deserialize('invalid-json');
      }).toThrow('Failed to deserialize KafkaEvent: invalid JSON');
    });

    it('should throw an error when deserializing an object missing required fields', () => {
      const invalidJson = JSON.stringify({ topic: 'test-topic' }); // Missing most fields
      
      expect(() => {
        KafkaEvent.deserialize(invalidJson);
      }).toThrow('Invalid KafkaEvent format: missing required fields');
    });
  });
});
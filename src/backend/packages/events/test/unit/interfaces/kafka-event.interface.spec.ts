import { v4 as uuidv4 } from 'uuid';
import { BaseEvent, EventMetadata, createEvent, isBaseEvent, validateEvent } from '../../../src/interfaces/base-event.interface';
import { 
  KafkaEvent, 
  KafkaHeaders, 
  KafkaEventProducerOptions, 
  KafkaEventConsumerOptions,
  ToKafkaEvent
} from '../../../src/interfaces/kafka-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

// Mock event types for testing
interface TestEventPayload {
  message: string;
  value: number;
  timestamp: string;
}

// Mock Kafka message format
interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key: Buffer | null;
  value: Buffer;
  headers: {
    [key: string]: Buffer;
  };
  timestamp: string;
}

describe('Kafka Event Interface', () => {
  // Test data
  const testEventId = uuidv4();
  const testCorrelationId = uuidv4();
  const testUserId = 'user-123';
  const testTimestamp = new Date().toISOString();
  
  // Create a base event for testing
  const baseEvent: BaseEvent<TestEventPayload> = {
    eventId: testEventId,
    type: 'TEST_EVENT',
    timestamp: testTimestamp,
    version: '1.0.0',
    source: 'test-service',
    journey: 'HEALTH',
    userId: testUserId,
    payload: {
      message: 'Test message',
      value: 42,
      timestamp: testTimestamp
    },
    metadata: {
      correlationId: testCorrelationId,
      priority: 'high'
    }
  };

  // Create a Kafka event for testing
  const kafkaEvent: KafkaEvent<TestEventPayload> = {
    ...baseEvent,
    topic: 'test-topic',
    partition: 0,
    offset: '100',
    key: 'test-key',
    headers: {
      'content-type': 'application/json',
      'event-type': 'TEST_EVENT',
      'correlation-id': testCorrelationId
    }
  };

  describe('KafkaEvent Structure', () => {
    it('should extend BaseEvent with Kafka-specific properties', () => {
      // Verify that KafkaEvent has all BaseEvent properties
      expect(kafkaEvent.eventId).toBe(baseEvent.eventId);
      expect(kafkaEvent.type).toBe(baseEvent.type);
      expect(kafkaEvent.timestamp).toBe(baseEvent.timestamp);
      expect(kafkaEvent.version).toBe(baseEvent.version);
      expect(kafkaEvent.source).toBe(baseEvent.source);
      expect(kafkaEvent.journey).toBe(baseEvent.journey);
      expect(kafkaEvent.userId).toBe(baseEvent.userId);
      expect(kafkaEvent.payload).toEqual(baseEvent.payload);
      expect(kafkaEvent.metadata).toEqual(baseEvent.metadata);
      
      // Verify Kafka-specific properties
      expect(kafkaEvent.topic).toBe('test-topic');
      expect(kafkaEvent.partition).toBe(0);
      expect(kafkaEvent.offset).toBe('100');
      expect(kafkaEvent.key).toBe('test-key');
      expect(kafkaEvent.headers).toBeDefined();
      expect(kafkaEvent.headers?.['content-type']).toBe('application/json');
    });

    it('should pass BaseEvent validation', () => {
      // KafkaEvent should pass BaseEvent validation
      const validationResult = validateEvent(kafkaEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });

    it('should be recognized as a BaseEvent', () => {
      // KafkaEvent should be recognized as a BaseEvent
      expect(isBaseEvent(kafkaEvent)).toBe(true);
    });
  });

  describe('Kafka Headers', () => {
    it('should support string key-value pairs', () => {
      const headers: KafkaHeaders = {
        'content-type': 'application/json',
        'event-type': 'TEST_EVENT',
        'correlation-id': testCorrelationId
      };

      expect(headers['content-type']).toBe('application/json');
      expect(headers['event-type']).toBe('TEST_EVENT');
      expect(headers['correlation-id']).toBe(testCorrelationId);
    });

    it('should allow adding new headers', () => {
      const headers: KafkaHeaders = {
        'content-type': 'application/json'
      };

      // Add new headers
      headers['event-type'] = 'TEST_EVENT';
      headers['correlation-id'] = testCorrelationId;

      expect(headers['content-type']).toBe('application/json');
      expect(headers['event-type']).toBe('TEST_EVENT');
      expect(headers['correlation-id']).toBe(testCorrelationId);
    });

    it('should allow updating existing headers', () => {
      const headers: KafkaHeaders = {
        'content-type': 'application/json',
        'event-type': 'OLD_EVENT'
      };

      // Update existing header
      headers['event-type'] = 'TEST_EVENT';

      expect(headers['content-type']).toBe('application/json');
      expect(headers['event-type']).toBe('TEST_EVENT');
    });
  });

  describe('Type Conversion', () => {
    it('should convert BaseEvent to KafkaEvent using ToKafkaEvent utility type', () => {
      // Create a variable of type ToKafkaEvent<BaseEvent<TestEventPayload>>
      const convertedEvent: ToKafkaEvent<BaseEvent<TestEventPayload>> = {
        ...baseEvent,
        topic: 'test-topic',
        partition: 0,
        offset: '100',
        key: 'test-key',
        headers: {
          'content-type': 'application/json'
        }
      };

      // Verify that the converted event has the correct structure
      expect(convertedEvent.eventId).toBe(baseEvent.eventId);
      expect(convertedEvent.payload).toEqual(baseEvent.payload);
      expect(convertedEvent.topic).toBe('test-topic');
      expect(convertedEvent.partition).toBe(0);
    });

    it('should preserve payload type when converting', () => {
      // Create a variable of type ToKafkaEvent<BaseEvent<TestEventPayload>>
      const convertedEvent: ToKafkaEvent<BaseEvent<TestEventPayload>> = {
        ...baseEvent,
        topic: 'test-topic'
      };

      // Verify that the payload type is preserved
      expect(convertedEvent.payload.message).toBe('Test message');
      expect(convertedEvent.payload.value).toBe(42);
      expect(convertedEvent.payload.timestamp).toBe(testTimestamp);
    });
  });

  describe('Serialization and Deserialization', () => {
    // Helper function to convert a KafkaEvent to a Kafka message
    function serializeToKafkaMessage(event: KafkaEvent): KafkaMessage {
      const headers: { [key: string]: Buffer } = {};
      
      // Convert string headers to Buffer
      if (event.headers) {
        Object.entries(event.headers).forEach(([key, value]) => {
          headers[key] = Buffer.from(value);
        });
      }
      
      // Add standard headers
      headers['event-id'] = Buffer.from(event.eventId);
      headers['event-type'] = Buffer.from(event.type);
      headers['source'] = Buffer.from(event.source);
      
      // Add correlation ID if present
      if (event.metadata?.correlationId) {
        headers['correlation-id'] = Buffer.from(event.metadata.correlationId);
      }
      
      return {
        topic: event.topic,
        partition: event.partition || 0,
        offset: event.offset || '0',
        key: event.key ? Buffer.from(event.key) : null,
        value: Buffer.from(JSON.stringify({
          eventId: event.eventId,
          type: event.type,
          timestamp: event.timestamp,
          version: event.version,
          source: event.source,
          journey: event.journey,
          userId: event.userId,
          payload: event.payload,
          metadata: event.metadata
        })),
        headers,
        timestamp: event.timestamp
      };
    }

    // Helper function to convert a Kafka message to a KafkaEvent
    function deserializeFromKafkaMessage<T = any>(message: KafkaMessage): KafkaEvent<T> {
      // Parse the message value
      const parsedValue = JSON.parse(message.value.toString());
      
      // Convert Buffer headers to strings
      const headers: KafkaHeaders = {};
      Object.entries(message.headers).forEach(([key, value]) => {
        headers[key] = value.toString();
      });
      
      return {
        eventId: parsedValue.eventId,
        type: parsedValue.type,
        timestamp: parsedValue.timestamp,
        version: parsedValue.version,
        source: parsedValue.source,
        journey: parsedValue.journey,
        userId: parsedValue.userId,
        payload: parsedValue.payload,
        metadata: parsedValue.metadata,
        topic: message.topic,
        partition: message.partition,
        offset: message.offset,
        key: message.key ? message.key.toString() : undefined,
        headers
      };
    }

    it('should serialize a KafkaEvent to a Kafka message', () => {
      const kafkaMessage = serializeToKafkaMessage(kafkaEvent);
      
      // Verify the Kafka message structure
      expect(kafkaMessage.topic).toBe(kafkaEvent.topic);
      expect(kafkaMessage.partition).toBe(kafkaEvent.partition);
      expect(kafkaMessage.offset).toBe(kafkaEvent.offset);
      expect(kafkaMessage.key?.toString()).toBe(kafkaEvent.key);
      
      // Verify headers
      expect(kafkaMessage.headers['event-id'].toString()).toBe(kafkaEvent.eventId);
      expect(kafkaMessage.headers['event-type'].toString()).toBe(kafkaEvent.type);
      expect(kafkaMessage.headers['source'].toString()).toBe(kafkaEvent.source);
      expect(kafkaMessage.headers['correlation-id'].toString()).toBe(testCorrelationId);
      
      // Verify the message value contains the event data
      const parsedValue = JSON.parse(kafkaMessage.value.toString());
      expect(parsedValue.eventId).toBe(kafkaEvent.eventId);
      expect(parsedValue.type).toBe(kafkaEvent.type);
      expect(parsedValue.payload).toEqual(kafkaEvent.payload);
    });

    it('should deserialize a Kafka message to a KafkaEvent', () => {
      // First serialize the event to a message
      const kafkaMessage = serializeToKafkaMessage(kafkaEvent);
      
      // Then deserialize it back to an event
      const deserializedEvent = deserializeFromKafkaMessage<TestEventPayload>(kafkaMessage);
      
      // Verify the deserialized event matches the original
      expect(deserializedEvent.eventId).toBe(kafkaEvent.eventId);
      expect(deserializedEvent.type).toBe(kafkaEvent.type);
      expect(deserializedEvent.timestamp).toBe(kafkaEvent.timestamp);
      expect(deserializedEvent.version).toBe(kafkaEvent.version);
      expect(deserializedEvent.source).toBe(kafkaEvent.source);
      expect(deserializedEvent.journey).toBe(kafkaEvent.journey);
      expect(deserializedEvent.userId).toBe(kafkaEvent.userId);
      expect(deserializedEvent.payload).toEqual(kafkaEvent.payload);
      expect(deserializedEvent.metadata).toEqual(kafkaEvent.metadata);
      expect(deserializedEvent.topic).toBe(kafkaEvent.topic);
      expect(deserializedEvent.partition).toBe(kafkaEvent.partition);
      expect(deserializedEvent.offset).toBe(kafkaEvent.offset);
      
      // Verify payload type is preserved
      expect(deserializedEvent.payload.message).toBe('Test message');
      expect(deserializedEvent.payload.value).toBe(42);
    });

    it('should handle missing optional properties during serialization/deserialization', () => {
      // Create an event with minimal Kafka properties
      const minimalEvent: KafkaEvent<TestEventPayload> = {
        ...baseEvent,
        topic: 'minimal-topic'
        // No partition, offset, key, or headers
      };
      
      // Serialize and deserialize
      const kafkaMessage = serializeToKafkaMessage(minimalEvent);
      const deserializedEvent = deserializeFromKafkaMessage<TestEventPayload>(kafkaMessage);
      
      // Verify the deserialized event
      expect(deserializedEvent.eventId).toBe(minimalEvent.eventId);
      expect(deserializedEvent.topic).toBe(minimalEvent.topic);
      expect(deserializedEvent.partition).toBe(0); // Default value
      expect(deserializedEvent.offset).toBe('0'); // Default value
      expect(deserializedEvent.key).toBeUndefined();
      expect(deserializedEvent.headers).toBeDefined();
      expect(deserializedEvent.headers?.['event-id']).toBe(minimalEvent.eventId);
    });
  });

  describe('Producer Options', () => {
    it('should create valid KafkaEventProducerOptions', () => {
      const producerOptions: KafkaEventProducerOptions = {
        topic: 'test-topic',
        key: 'test-key',
        headers: {
          'content-type': 'application/json',
          'event-type': 'TEST_EVENT'
        },
        partition: 1,
        requireAcks: true
      };
      
      expect(producerOptions.topic).toBe('test-topic');
      expect(producerOptions.key).toBe('test-key');
      expect(producerOptions.headers?.['content-type']).toBe('application/json');
      expect(producerOptions.partition).toBe(1);
      expect(producerOptions.requireAcks).toBe(true);
    });

    it('should support minimal producer options with just a topic', () => {
      const minimalOptions: KafkaEventProducerOptions = {
        topic: 'test-topic'
      };
      
      expect(minimalOptions.topic).toBe('test-topic');
      expect(minimalOptions.key).toBeUndefined();
      expect(minimalOptions.headers).toBeUndefined();
      expect(minimalOptions.partition).toBeUndefined();
      expect(minimalOptions.requireAcks).toBeUndefined();
    });
  });

  describe('Consumer Options', () => {
    it('should create valid KafkaEventConsumerOptions', () => {
      const consumerOptions: KafkaEventConsumerOptions = {
        topic: 'test-topic',
        groupId: 'test-group',
        fromBeginning: true,
        concurrency: 5,
        retry: {
          maxRetries: 3,
          initialRetryTime: 1000,
          backoffFactor: 2
        },
        deadLetterQueue: {
          topic: 'test-dlq',
          includeErrorDetails: true
        }
      };
      
      expect(consumerOptions.topic).toBe('test-topic');
      expect(consumerOptions.groupId).toBe('test-group');
      expect(consumerOptions.fromBeginning).toBe(true);
      expect(consumerOptions.concurrency).toBe(5);
      expect(consumerOptions.retry?.maxRetries).toBe(3);
      expect(consumerOptions.retry?.initialRetryTime).toBe(1000);
      expect(consumerOptions.retry?.backoffFactor).toBe(2);
      expect(consumerOptions.deadLetterQueue?.topic).toBe('test-dlq');
      expect(consumerOptions.deadLetterQueue?.includeErrorDetails).toBe(true);
    });

    it('should support minimal consumer options with just topic and groupId', () => {
      const minimalOptions: KafkaEventConsumerOptions = {
        topic: 'test-topic',
        groupId: 'test-group'
      };
      
      expect(minimalOptions.topic).toBe('test-topic');
      expect(minimalOptions.groupId).toBe('test-group');
      expect(minimalOptions.fromBeginning).toBeUndefined();
      expect(minimalOptions.concurrency).toBeUndefined();
      expect(minimalOptions.retry).toBeUndefined();
      expect(minimalOptions.deadLetterQueue).toBeUndefined();
    });

    it('should support retry configuration without dead letter queue', () => {
      const retryOptions: KafkaEventConsumerOptions = {
        topic: 'test-topic',
        groupId: 'test-group',
        retry: {
          maxRetries: 3,
          initialRetryTime: 1000,
          backoffFactor: 2
        }
        // No deadLetterQueue
      };
      
      expect(retryOptions.topic).toBe('test-topic');
      expect(retryOptions.groupId).toBe('test-group');
      expect(retryOptions.retry?.maxRetries).toBe(3);
      expect(retryOptions.retry?.initialRetryTime).toBe(1000);
      expect(retryOptions.retry?.backoffFactor).toBe(2);
      expect(retryOptions.deadLetterQueue).toBeUndefined();
    });

    it('should support dead letter queue configuration without retry', () => {
      const dlqOptions: KafkaEventConsumerOptions = {
        topic: 'test-topic',
        groupId: 'test-group',
        deadLetterQueue: {
          topic: 'test-dlq',
          includeErrorDetails: true
        }
        // No retry
      };
      
      expect(dlqOptions.topic).toBe('test-topic');
      expect(dlqOptions.groupId).toBe('test-group');
      expect(dlqOptions.retry).toBeUndefined();
      expect(dlqOptions.deadLetterQueue?.topic).toBe('test-dlq');
      expect(dlqOptions.deadLetterQueue?.includeErrorDetails).toBe(true);
    });
  });

  describe('Integration with createEvent utility', () => {
    it('should convert a created BaseEvent to a KafkaEvent', () => {
      // Create a base event using the utility function
      const createdEvent = createEvent<TestEventPayload>(
        'TEST_EVENT',
        'test-service',
        {
          message: 'Created event',
          value: 100,
          timestamp: testTimestamp
        },
        {
          userId: testUserId,
          journey: 'HEALTH',
          metadata: {
            correlationId: testCorrelationId
          }
        }
      );
      
      // Convert to KafkaEvent
      const kafkaEvent: KafkaEvent<TestEventPayload> = {
        ...createdEvent,
        topic: 'test-topic',
        partition: 0,
        offset: '100',
        key: testUserId,
        headers: {
          'content-type': 'application/json',
          'event-type': 'TEST_EVENT',
          'correlation-id': testCorrelationId
        }
      };
      
      // Verify the converted event
      expect(kafkaEvent.eventId).toBe(createdEvent.eventId);
      expect(kafkaEvent.type).toBe('TEST_EVENT');
      expect(kafkaEvent.source).toBe('test-service');
      expect(kafkaEvent.payload.message).toBe('Created event');
      expect(kafkaEvent.payload.value).toBe(100);
      expect(kafkaEvent.topic).toBe('test-topic');
      expect(kafkaEvent.partition).toBe(0);
      expect(kafkaEvent.offset).toBe('100');
      expect(kafkaEvent.key).toBe(testUserId);
    });
  });
});
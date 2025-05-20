import { describe, it, expect } from 'jest';
import { Kafka, Producer, Consumer, CompressionTypes, Message, KafkaMessage } from 'kafkajs';

// Import our custom types that extend or use KafkaJS types
import { KafkaEvent } from '../../../src/kafka/kafka.types';
import { EventType } from '../../../src/dto/event-types.enum';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';

// Import mock implementations for testing
import { 
  mockKafkaProducer,
  mockKafkaConsumer,
  mockJourneyEvent,
  mockKafkaMessage
} from './mocks';

describe('Kafka Type Definitions', () => {
  /**
   * Test suite for verifying the completeness and correctness of Kafka type definitions
   * These tests ensure that our type system correctly represents Kafka concepts and
   * integrates properly with the KafkaJS library.
   */
  
  describe('KafkaJS Core Types', () => {
    it('should have correct Kafka client type definition', () => {
      // Type verification for Kafka client configuration
      const kafkaConfig: ConstructorParameters<typeof Kafka>[0] = {
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        ssl: false,
        sasl: undefined,
        connectionTimeout: 1000,
        requestTimeout: 30000,
      };
      
      // Create a Kafka instance to verify the type is correct
      const kafka = new Kafka(kafkaConfig);
      
      // Verify that the Kafka instance has the expected methods
      expect(typeof kafka.producer).toBe('function');
      expect(typeof kafka.consumer).toBe('function');
      expect(typeof kafka.admin).toBe('function');
    });

    it('should have correct Producer type definition', () => {
      // Type verification for Producer configuration
      const producerConfig: Parameters<typeof Kafka.prototype.producer>[0] = {
        createPartitioner: undefined,
        retry: {
          initialRetryTime: 100,
          retries: 8
        },
        metadataMaxAge: 300000,
        allowAutoTopicCreation: true,
        transactionTimeout: 60000,
        idempotent: false
      };
      
      // Create a mock producer to verify the type is correct
      const producer: Producer = mockKafkaProducer();
      
      // Verify that the producer has the expected methods
      expect(typeof producer.connect).toBe('function');
      expect(typeof producer.disconnect).toBe('function');
      expect(typeof producer.send).toBe('function');
      expect(typeof producer.sendBatch).toBe('function');
      expect(typeof producer.transaction).toBe('function');
    });

    it('should have correct Consumer type definition', () => {
      // Type verification for Consumer configuration
      const consumerConfig: Parameters<typeof Kafka.prototype.consumer>[0] = {
        groupId: 'test-group',
        partitionAssigners: [],
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        heartbeatInterval: 3000,
        metadataMaxAge: 300000,
        allowAutoTopicCreation: true,
        maxBytesPerPartition: 1048576,
        minBytes: 1,
        maxBytes: 10485760,
        maxWaitTimeInMs: 5000,
      };
      
      // Create a mock consumer to verify the type is correct
      const consumer: Consumer = mockKafkaConsumer();
      
      // Verify that the consumer has the expected methods
      expect(typeof consumer.connect).toBe('function');
      expect(typeof consumer.disconnect).toBe('function');
      expect(typeof consumer.subscribe).toBe('function');
      expect(typeof consumer.run).toBe('function');
      expect(typeof consumer.stop).toBe('function');
      expect(typeof consumer.seek).toBe('function');
      expect(typeof consumer.pause).toBe('function');
      expect(typeof consumer.resume).toBe('function');
    });

    it('should have correct Message type definition', () => {
      // Type verification for Message
      const message: Message = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: Date.now().toString(),
        headers: {
          'correlation-id': 'test-correlation-id',
          'source-service': 'test-service'
        },
        partition: 0
      };
      
      // Verify message structure
      expect(message.key).toBeInstanceOf(Buffer);
      expect(message.value).toBeInstanceOf(Buffer);
      expect(typeof message.timestamp).toBe('string');
      expect(typeof message.headers).toBe('object');
    });

    it('should have correct KafkaMessage type definition', () => {
      // Type verification for KafkaMessage (consumed message)
      const kafkaMessage: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1622548800000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          'correlation-id': Buffer.from('test-correlation-id'),
          'source-service': Buffer.from('test-service')
        }
      };
      
      // Verify KafkaMessage structure
      expect(kafkaMessage.key).toBeInstanceOf(Buffer);
      expect(kafkaMessage.value).toBeInstanceOf(Buffer);
      expect(typeof kafkaMessage.timestamp).toBe('string');
      expect(typeof kafkaMessage.offset).toBe('string');
      expect(typeof kafkaMessage.headers).toBe('object');
    });

    it('should have correct CompressionTypes enum', () => {
      // Verify CompressionTypes enum values
      expect(CompressionTypes.None).toBe(0);
      expect(CompressionTypes.GZIP).toBe(1);
      expect(CompressionTypes.Snappy).toBe(2);
      expect(CompressionTypes.LZ4).toBe(3);
      expect(CompressionTypes.ZSTD).toBe(4);
    });
  });

  describe('Custom Kafka Event Types', () => {
    it('should correctly extend BaseEvent with Kafka-specific properties', () => {
      // Create a KafkaEvent instance
      const kafkaEvent: KafkaEvent<any> = {
        eventId: 'test-event-id',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: EventType.HEALTH_METRIC_RECORDED,
        payload: { metricValue: 120 },
        topic: 'health.events',
        partition: 0,
        offset: '0',
        headers: {
          'correlation-id': 'test-correlation-id'
        }
      };
      
      // Verify KafkaEvent structure
      expect(kafkaEvent.eventId).toBeDefined();
      expect(kafkaEvent.timestamp).toBeDefined();
      expect(kafkaEvent.version).toBeDefined();
      expect(kafkaEvent.source).toBeDefined();
      expect(kafkaEvent.type).toBeDefined();
      expect(kafkaEvent.payload).toBeDefined();
      expect(kafkaEvent.topic).toBeDefined();
      expect(kafkaEvent.partition).toBeDefined();
      expect(kafkaEvent.offset).toBeDefined();
      expect(kafkaEvent.headers).toBeDefined();
    });

    it('should allow conversion between BaseEvent and KafkaEvent', () => {
      // Create a BaseEvent
      const baseEvent: BaseEvent<any> = {
        eventId: 'test-event-id',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: EventType.HEALTH_METRIC_RECORDED,
        payload: { metricValue: 120 }
      };
      
      // Convert to KafkaEvent
      const kafkaEvent: KafkaEvent<any> = {
        ...baseEvent,
        topic: 'health.events',
        partition: 0,
        offset: '0',
        headers: {
          'correlation-id': 'test-correlation-id'
        }
      };
      
      // Verify conversion
      expect(kafkaEvent.eventId).toBe(baseEvent.eventId);
      expect(kafkaEvent.timestamp).toBe(baseEvent.timestamp);
      expect(kafkaEvent.version).toBe(baseEvent.version);
      expect(kafkaEvent.source).toBe(baseEvent.source);
      expect(kafkaEvent.type).toBe(baseEvent.type);
      expect(kafkaEvent.payload).toBe(baseEvent.payload);
    });
  });

  describe('Journey-Specific Event Types', () => {
    it('should validate Health journey event types', () => {
      // Create a Health journey event
      const healthEvent = mockJourneyEvent('health');
      
      // Verify event structure
      expect(healthEvent.eventId).toBeDefined();
      expect(healthEvent.timestamp).toBeDefined();
      expect(healthEvent.version).toBeDefined();
      expect(healthEvent.source).toBeDefined();
      expect(healthEvent.type).toBeDefined();
      expect(healthEvent.payload).toBeDefined();
      
      // Verify health-specific properties
      expect([EventType.HEALTH_METRIC_RECORDED, EventType.HEALTH_GOAL_ACHIEVED, 
              EventType.HEALTH_DEVICE_CONNECTED, EventType.HEALTH_INSIGHT_GENERATED])
        .toContain(healthEvent.type);
    });

    it('should validate Care journey event types', () => {
      // Create a Care journey event
      const careEvent = mockJourneyEvent('care');
      
      // Verify event structure
      expect(careEvent.eventId).toBeDefined();
      expect(careEvent.timestamp).toBeDefined();
      expect(careEvent.version).toBeDefined();
      expect(careEvent.source).toBeDefined();
      expect(careEvent.type).toBeDefined();
      expect(careEvent.payload).toBeDefined();
      
      // Verify care-specific properties
      expect([EventType.CARE_APPOINTMENT_BOOKED, EventType.CARE_MEDICATION_TAKEN, 
              EventType.CARE_TELEMEDICINE_COMPLETED, EventType.CARE_PLAN_UPDATED])
        .toContain(careEvent.type);
    });

    it('should validate Plan journey event types', () => {
      // Create a Plan journey event
      const planEvent = mockJourneyEvent('plan');
      
      // Verify event structure
      expect(planEvent.eventId).toBeDefined();
      expect(planEvent.timestamp).toBeDefined();
      expect(planEvent.version).toBeDefined();
      expect(planEvent.source).toBeDefined();
      expect(planEvent.type).toBeDefined();
      expect(planEvent.payload).toBeDefined();
      
      // Verify plan-specific properties
      expect([EventType.PLAN_CLAIM_SUBMITTED, EventType.PLAN_BENEFIT_USED, 
              EventType.PLAN_SELECTED, EventType.PLAN_DOCUMENT_UPLOADED])
        .toContain(planEvent.type);
    });
  });

  describe('Cross-Service Type Consistency', () => {
    it('should ensure consistent message format between producer and consumer', () => {
      // Create a message to be sent by producer
      const producerMessage: Message = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({
          eventId: 'test-event-id',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          source: 'test-service',
          type: EventType.HEALTH_METRIC_RECORDED,
          payload: { metricValue: 120 }
        })),
        headers: {
          'correlation-id': 'test-correlation-id',
          'event-type': EventType.HEALTH_METRIC_RECORDED,
          'source-service': 'test-service',
          'event-version': '1.0.0'
        }
      };
      
      // Simulate message received by consumer
      const consumerMessage: KafkaMessage = {
        key: producerMessage.key,
        value: producerMessage.value,
        timestamp: Date.now().toString(),
        size: producerMessage.value.length,
        attributes: 0,
        offset: '0',
        headers: Object.entries(producerMessage.headers).reduce((acc, [key, value]) => {
          acc[key] = Buffer.from(value);
          return acc;
        }, {} as Record<string, Buffer>)
      };
      
      // Verify message consistency
      expect(consumerMessage.key).toEqual(producerMessage.key);
      expect(consumerMessage.value).toEqual(producerMessage.value);
      
      // Verify headers consistency (accounting for Buffer conversion)
      Object.entries(producerMessage.headers).forEach(([key, value]) => {
        expect(consumerMessage.headers[key]).toBeDefined();
        expect(consumerMessage.headers[key].toString()).toBe(value);
      });
    });

    it('should ensure consistent event schema across services', () => {
      // Create events from different journeys
      const healthEvent = mockJourneyEvent('health');
      const careEvent = mockJourneyEvent('care');
      const planEvent = mockJourneyEvent('plan');
      
      // Verify common structure across all events
      [healthEvent, careEvent, planEvent].forEach(event => {
        expect(event.eventId).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.version).toBeDefined();
        expect(event.source).toBeDefined();
        expect(event.type).toBeDefined();
        expect(event.payload).toBeDefined();
      });
      
      // Verify that events can be converted to KafkaEvents
      const healthKafkaEvent: KafkaEvent<any> = {
        ...healthEvent,
        topic: 'health.events',
        partition: 0,
        offset: '0',
        headers: { 'correlation-id': 'test-correlation-id' }
      };
      
      const careKafkaEvent: KafkaEvent<any> = {
        ...careEvent,
        topic: 'care.events',
        partition: 0,
        offset: '0',
        headers: { 'correlation-id': 'test-correlation-id' }
      };
      
      const planKafkaEvent: KafkaEvent<any> = {
        ...planEvent,
        topic: 'plan.events',
        partition: 0,
        offset: '0',
        headers: { 'correlation-id': 'test-correlation-id' }
      };
      
      // Verify KafkaEvent structure consistency
      [healthKafkaEvent, careKafkaEvent, planKafkaEvent].forEach(event => {
        expect(event.eventId).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.version).toBeDefined();
        expect(event.source).toBeDefined();
        expect(event.type).toBeDefined();
        expect(event.payload).toBeDefined();
        expect(event.topic).toBeDefined();
        expect(event.partition).toBeDefined();
        expect(event.offset).toBeDefined();
        expect(event.headers).toBeDefined();
      });
    });
  });
});
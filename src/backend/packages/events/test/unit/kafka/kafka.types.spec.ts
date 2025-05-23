/**
 * @file kafka.types.spec.ts
 * @description Unit tests for Kafka type definitions, focusing on type correctness, compatibility with KafkaJS library,
 * and integration with application types. These tests verify type safety for all Kafka operations, ensuring that the
 * event schema is correctly implemented and maintained.
 */

import { KafkaMessage as KafkaJsMessage, Consumer, Producer, Admin } from 'kafkajs';
import {
  KafkaMessage,
  KafkaEventMessage,
  KafkaVersionedEventMessage,
  KafkaHeaders,
  KafkaProducerConfig,
  KafkaConsumerConfig,
  KafkaRetryConfig,
  KafkaProducerSendOptions,
  KafkaProducerRecord,
  KafkaEventProducerRecord,
  KafkaProducerResult,
  KafkaConsumerSubscribeOptions,
  KafkaConsumerCommitOptions,
  KafkaMessageHandler,
  KafkaEventHandler,
  KafkaBatchMessageHandler,
  KafkaBatchEventHandler,
  KafkaAdminConfig,
  KafkaTopicConfig,
  KafkaError,
  KafkaDeadLetterQueueMessage,
  KafkaValidationOptions,
  KafkaValidationResult,
  KafkaMessagePayload,
  ToKafkaMessage,
  FromKafkaMessage,
  KafkaClient,
  KafkaHealthStatus,
  KafkaDeadLetterQueueConfig
} from '../../../src/kafka/kafka.types';
import { BaseEvent, EventMetadata } from '../../../src/interfaces/base-event.interface';
import { IVersionedEvent, EventVersion } from '../../../src/interfaces/event-versioning.interface';
import { ValidationResult } from '../../../src/interfaces/event-validation.interface';
import { IEventResponse } from '../../../src/interfaces/event-response.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

// Mock types for testing
interface MockHealthEvent extends BaseEvent<{ metricValue: number; metricType: string }> {
  journey: JourneyType.HEALTH;
}

interface MockCareEvent extends BaseEvent<{ appointmentId: string; providerId: string }> {
  journey: JourneyType.CARE;
}

interface MockPlanEvent extends BaseEvent<{ claimId: string; amount: number }> {
  journey: JourneyType.PLAN;
}

interface MockVersionedEvent extends IVersionedEvent<{ data: string }> {
  type: 'TEST_EVENT';
}

describe('Kafka Types', () => {
  describe('Basic Kafka Message Types', () => {
    it('should define KafkaHeaders as a record of string or Buffer', () => {
      // Type assertion test
      const headers: KafkaHeaders = {
        'content-type': 'application/json',
        'event-type': 'TEST_EVENT',
        'correlation-id': Buffer.from('test-correlation-id')
      };

      expect(headers).toBeDefined();
      expect(typeof headers['content-type']).toBe('string');
      expect(headers['correlation-id']).toBeInstanceOf(Buffer);
    });

    it('should define KafkaMessage with generic payload typing', () => {
      // Type assertion test
      const message: KafkaMessage<{ test: string }> = {
        topic: 'test-topic',
        partition: 0,
        key: 'test-key',
        value: { test: 'value' },
        headers: {
          'content-type': 'application/json'
        },
        timestamp: '1234567890',
        offset: '0'
      };

      expect(message).toBeDefined();
      expect(message.value).toEqual({ test: 'value' });
      expect(message.topic).toBe('test-topic');
    });

    it('should ensure KafkaMessage extends KafkaJS Message type', () => {
      // Create a KafkaJS message
      const kafkaJsMessage: KafkaJsMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ test: 'value' })),
        headers: {
          'content-type': Buffer.from('application/json')
        },
        timestamp: '1234567890',
        offset: '0',
        size: 100,
        attributes: 0
      };

      // Convert to our KafkaMessage type (omitting value which we'll set separately)
      const { value, ...rest } = kafkaJsMessage;
      const message: KafkaMessage<{ test: string }> = {
        ...rest,
        value: JSON.parse(value.toString()),
        topic: 'test-topic',
        partition: 0
      };

      expect(message).toBeDefined();
      expect(message.value).toEqual({ test: 'value' });
      expect(message.key).toEqual(kafkaJsMessage.key);
      expect(message.headers).toEqual(kafkaJsMessage.headers);
    });

    it('should define KafkaEventMessage for application events', () => {
      // Create a mock health event
      const healthEvent: MockHealthEvent = {
        eventId: '123',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journey: JourneyType.HEALTH,
        userId: 'user-123',
        payload: {
          metricValue: 120,
          metricType: 'BLOOD_PRESSURE'
        }
      };

      // Create a KafkaEventMessage with the health event
      const message: KafkaEventMessage<MockHealthEvent> = {
        topic: 'health-events',
        partition: 0,
        key: healthEvent.userId,
        value: healthEvent,
        headers: {
          'event-type': healthEvent.type,
          'journey': healthEvent.journey
        }
      };

      expect(message).toBeDefined();
      expect(message.value).toEqual(healthEvent);
      expect(message.value.journey).toBe(JourneyType.HEALTH);
      expect(message.value.payload.metricType).toBe('BLOOD_PRESSURE');
    });

    it('should define KafkaVersionedEventMessage for versioned events', () => {
      // Create a mock versioned event
      const versionedEvent: MockVersionedEvent = {
        type: 'TEST_EVENT',
        version: { major: 1, minor: 0, patch: 0 },
        payload: { data: 'test data' },
        metadata: { correlationId: 'corr-123' }
      };

      // Create a KafkaVersionedEventMessage with the versioned event
      const message: KafkaVersionedEventMessage<MockVersionedEvent> = {
        topic: 'versioned-events',
        partition: 0,
        key: 'test-key',
        value: versionedEvent,
        headers: {
          'event-type': versionedEvent.type,
          'version': `${versionedEvent.version.major}.${versionedEvent.version.minor}.${versionedEvent.version.patch}`
        }
      };

      expect(message).toBeDefined();
      expect(message.value).toEqual(versionedEvent);
      expect(message.value.version).toEqual({ major: 1, minor: 0, patch: 0 });
      expect(message.value.payload.data).toBe('test data');
    });
  });

  describe('Producer Types', () => {
    it('should define KafkaProducerConfig with all required properties', () => {
      const config: KafkaProducerConfig = {
        clientId: 'test-producer',
        brokers: ['localhost:9092'],
        allowAutoTopicCreation: true,
        requestTimeout: 30000,
        retry: {
          maxRetries: 5,
          initialRetryTime: 100,
          retryFactor: 1.5,
          maxRetryTime: 30000,
          retryableErrors: ['LEADER_NOT_AVAILABLE']
        },
        compression: 'gzip',
        maxBatchSize: 16384,
        idempotent: true,
        transactionalId: 'test-transaction'
      };

      expect(config).toBeDefined();
      expect(config.brokers).toEqual(['localhost:9092']);
      expect(config.retry.maxRetries).toBe(5);
    });

    it('should define KafkaRetryConfig with all required properties', () => {
      const retryConfig: KafkaRetryConfig = {
        maxRetries: 5,
        initialRetryTime: 100,
        retryFactor: 1.5,
        maxRetryTime: 30000,
        retryableErrors: ['LEADER_NOT_AVAILABLE', 'NOT_LEADER_FOR_PARTITION']
      };

      expect(retryConfig).toBeDefined();
      expect(retryConfig.maxRetries).toBe(5);
      expect(retryConfig.retryFactor).toBe(1.5);
      expect(retryConfig.retryableErrors).toContain('LEADER_NOT_AVAILABLE');
    });

    it('should define KafkaProducerSendOptions with all required properties', () => {
      const options: KafkaProducerSendOptions = {
        topic: 'test-topic',
        partition: 0,
        acks: -1,
        timeout: 30000,
        compression: 'gzip',
        headers: {
          'content-type': 'application/json'
        }
      };

      expect(options).toBeDefined();
      expect(options.topic).toBe('test-topic');
      expect(options.acks).toBe(-1);
      expect(options.compression).toBe('gzip');
    });

    it('should define KafkaProducerRecord with generic payload typing', () => {
      const record: KafkaProducerRecord<{ test: string }> = {
        topic: 'test-topic',
        messages: [
          {
            key: 'test-key',
            value: { test: 'value' },
            partition: 0,
            headers: {
              'content-type': 'application/json'
            },
            timestamp: '1234567890'
          }
        ],
        acks: -1,
        timeout: 30000,
        compression: 'gzip'
      };

      expect(record).toBeDefined();
      expect(record.topic).toBe('test-topic');
      expect(record.messages[0].value).toEqual({ test: 'value' });
    });

    it('should define KafkaEventProducerRecord for strongly typed events', () => {
      // Create a mock health event
      const healthEvent: MockHealthEvent = {
        eventId: '123',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journey: JourneyType.HEALTH,
        userId: 'user-123',
        payload: {
          metricValue: 120,
          metricType: 'BLOOD_PRESSURE'
        }
      };

      // Create a KafkaEventProducerRecord with the health event
      const record: KafkaEventProducerRecord<MockHealthEvent> = {
        topic: 'health-events',
        messages: [
          {
            key: healthEvent.userId,
            value: healthEvent,
            headers: {
              'event-type': healthEvent.type,
              'journey': healthEvent.journey
            }
          }
        ],
        acks: -1
      };

      expect(record).toBeDefined();
      expect(record.topic).toBe('health-events');
      expect(record.messages[0].value).toEqual(healthEvent);
      expect(record.messages[0].value.journey).toBe(JourneyType.HEALTH);
    });

    it('should define KafkaProducerResult with all required properties', () => {
      const result: KafkaProducerResult = {
        topic: 'test-topic',
        partition: 0,
        offset: '100',
        timestamp: '1234567890',
        baseOffset: '100',
        logAppendTime: '1234567890',
        logStartOffset: '0'
      };

      expect(result).toBeDefined();
      expect(result.topic).toBe('test-topic');
      expect(result.offset).toBe('100');
      expect(result.timestamp).toBe('1234567890');
    });
  });

  describe('Consumer Types', () => {
    it('should define KafkaConsumerConfig with all required properties', () => {
      const config: KafkaConsumerConfig = {
        clientId: 'test-consumer',
        brokers: ['localhost:9092'],
        groupId: 'test-group',
        requestTimeout: 30000,
        retry: {
          maxRetries: 5,
          initialRetryTime: 100,
          retryFactor: 1.5
        },
        maxParallelMessages: 10,
        autoCommit: true,
        autoCommitInterval: 5000,
        maxBytesPerPartition: 1048576,
        minBytes: 1,
        maxBytes: 10485760,
        maxWaitTimeInMs: 5000,
        isolationLevel: 'READ_COMMITTED',
        fromBeginning: false,
        partitionAssigners: ['round-robin'],
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        heartbeatInterval: 3000,
        allowAutoTopicCreation: true,
        maxAttempts: 3,
        deadLetterQueue: {
          enabled: true,
          topic: 'dead-letter-queue',
          maxAttempts: 3,
          includeOriginalMessage: true,
          includeErrorDetails: true
        }
      };

      expect(config).toBeDefined();
      expect(config.brokers).toEqual(['localhost:9092']);
      expect(config.groupId).toBe('test-group');
      expect(config.deadLetterQueue.enabled).toBe(true);
    });

    it('should define KafkaDeadLetterQueueConfig with all required properties', () => {
      const dlqConfig: KafkaDeadLetterQueueConfig = {
        enabled: true,
        topic: 'dead-letter-queue',
        maxAttempts: 3,
        includeOriginalMessage: true,
        includeErrorDetails: true
      };

      expect(dlqConfig).toBeDefined();
      expect(dlqConfig.enabled).toBe(true);
      expect(dlqConfig.topic).toBe('dead-letter-queue');
      expect(dlqConfig.maxAttempts).toBe(3);
    });

    it('should define KafkaConsumerSubscribeOptions with all required properties', () => {
      const options: KafkaConsumerSubscribeOptions = {
        topics: ['test-topic-1', 'test-topic-2'],
        fromBeginning: true
      };

      expect(options).toBeDefined();
      expect(options.topics).toEqual(['test-topic-1', 'test-topic-2']);
      expect(options.fromBeginning).toBe(true);
    });

    it('should define KafkaConsumerCommitOptions with all required properties', () => {
      const options: KafkaConsumerCommitOptions = {
        topics: [
          {
            topic: 'test-topic',
            partitions: [
              {
                partition: 0,
                offset: '100'
              },
              {
                partition: 1,
                offset: '200'
              }
            ]
          }
        ]
      };

      expect(options).toBeDefined();
      expect(options.topics[0].topic).toBe('test-topic');
      expect(options.topics[0].partitions[0].partition).toBe(0);
      expect(options.topics[0].partitions[0].offset).toBe('100');
    });

    it('should define KafkaMessageHandler for processing messages', () => {
      // Define a message handler
      const handler: KafkaMessageHandler<{ test: string }> = (message, topic, partition) => {
        expect(message.value).toEqual({ test: 'value' });
        expect(topic).toBe('test-topic');
        expect(partition).toBe(0);
      };

      // Create a message to test the handler
      const message: KafkaMessage<{ test: string }> = {
        topic: 'test-topic',
        partition: 0,
        key: 'test-key',
        value: { test: 'value' },
        headers: {
          'content-type': 'application/json'
        }
      };

      // Call the handler
      handler(message, 'test-topic', 0);

      // This is just a type assertion test, no actual assertion needed
      expect(handler).toBeDefined();
    });

    it('should define KafkaEventHandler for processing events', () => {
      // Create a mock health event
      const healthEvent: MockHealthEvent = {
        eventId: '123',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journey: JourneyType.HEALTH,
        userId: 'user-123',
        payload: {
          metricValue: 120,
          metricType: 'BLOOD_PRESSURE'
        }
      };

      // Define an event handler
      const handler: KafkaEventHandler<MockHealthEvent> = (event, message, topic, partition) => {
        expect(event).toEqual(healthEvent);
        expect(message.value).toEqual(healthEvent);
        expect(topic).toBe('health-events');
        expect(partition).toBe(0);

        // Return a successful response
        return {
          success: true,
          eventId: event.eventId,
          eventType: event.type,
          data: { processed: true },
          metadata: {
            processingTimeMs: 10,
            completedAt: new Date().toISOString()
          }
        };
      };

      // Create a message to test the handler
      const message: KafkaEventMessage<MockHealthEvent> = {
        topic: 'health-events',
        partition: 0,
        key: healthEvent.userId,
        value: healthEvent,
        headers: {
          'event-type': healthEvent.type,
          'journey': healthEvent.journey
        }
      };

      // Call the handler
      const response = handler(healthEvent, message, 'health-events', 0);

      // Verify the response
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.eventId).toBe(healthEvent.eventId);
      expect(response.eventType).toBe(healthEvent.type);
    });

    it('should define KafkaBatchMessageHandler for batch processing', () => {
      // Define a batch message handler
      const handler: KafkaBatchMessageHandler<{ test: string }> = (messages, topic, partition) => {
        expect(messages.length).toBe(2);
        expect(messages[0].value).toEqual({ test: 'value1' });
        expect(messages[1].value).toEqual({ test: 'value2' });
        expect(topic).toBe('test-topic');
        expect(partition).toBe(0);
      };

      // Create messages to test the handler
      const messages: KafkaMessage<{ test: string }>[] = [
        {
          topic: 'test-topic',
          partition: 0,
          key: 'test-key-1',
          value: { test: 'value1' },
          headers: { 'content-type': 'application/json' }
        },
        {
          topic: 'test-topic',
          partition: 0,
          key: 'test-key-2',
          value: { test: 'value2' },
          headers: { 'content-type': 'application/json' }
        }
      ];

      // Call the handler
      handler(messages, 'test-topic', 0);

      // This is just a type assertion test, no actual assertion needed
      expect(handler).toBeDefined();
    });

    it('should define KafkaBatchEventHandler for batch event processing', () => {
      // Create mock health events
      const healthEvents: MockHealthEvent[] = [
        {
          eventId: '123',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          source: 'health-service',
          journey: JourneyType.HEALTH,
          userId: 'user-123',
          payload: {
            metricValue: 120,
            metricType: 'BLOOD_PRESSURE'
          }
        },
        {
          eventId: '124',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          source: 'health-service',
          journey: JourneyType.HEALTH,
          userId: 'user-123',
          payload: {
            metricValue: 80,
            metricType: 'HEART_RATE'
          }
        }
      ];

      // Define a batch event handler
      const handler: KafkaBatchEventHandler<MockHealthEvent> = (events, messages, topic, partition) => {
        expect(events.length).toBe(2);
        expect(events[0]).toEqual(healthEvents[0]);
        expect(events[1]).toEqual(healthEvents[1]);
        expect(messages.length).toBe(2);
        expect(messages[0].value).toEqual(healthEvents[0]);
        expect(messages[1].value).toEqual(healthEvents[1]);
        expect(topic).toBe('health-events');
        expect(partition).toBe(0);

        // Return successful responses
        return events.map(event => ({
          success: true,
          eventId: event.eventId,
          eventType: event.type,
          data: { processed: true },
          metadata: {
            processingTimeMs: 10,
            completedAt: new Date().toISOString()
          }
        }));
      };

      // Create messages to test the handler
      const messages: KafkaEventMessage<MockHealthEvent>[] = healthEvents.map(event => ({
        topic: 'health-events',
        partition: 0,
        key: event.userId,
        value: event,
        headers: {
          'event-type': event.type,
          'journey': event.journey
        }
      }));

      // Call the handler
      const responses = handler(healthEvents, messages, 'health-events', 0);

      // Verify the responses
      expect(responses).toBeDefined();
      expect(responses.length).toBe(2);
      expect(responses[0].success).toBe(true);
      expect(responses[0].eventId).toBe(healthEvents[0].eventId);
      expect(responses[1].success).toBe(true);
      expect(responses[1].eventId).toBe(healthEvents[1].eventId);
    });
  });

  describe('Admin Types', () => {
    it('should define KafkaAdminConfig with all required properties', () => {
      const config: KafkaAdminConfig = {
        clientId: 'test-admin',
        brokers: ['localhost:9092'],
        requestTimeout: 30000,
        retry: {
          maxRetries: 5,
          initialRetryTime: 100,
          retryFactor: 1.5
        }
      };

      expect(config).toBeDefined();
      expect(config.brokers).toEqual(['localhost:9092']);
      expect(config.clientId).toBe('test-admin');
    });

    it('should define KafkaTopicConfig with all required properties', () => {
      const topicConfig: KafkaTopicConfig = {
        topic: 'test-topic',
        numPartitions: 3,
        replicationFactor: 2,
        configEntries: [
          { name: 'cleanup.policy', value: 'compact' },
          { name: 'retention.ms', value: '604800000' }
        ]
      };

      expect(topicConfig).toBeDefined();
      expect(topicConfig.topic).toBe('test-topic');
      expect(topicConfig.numPartitions).toBe(3);
      expect(topicConfig.replicationFactor).toBe(2);
      expect(topicConfig.configEntries[0].name).toBe('cleanup.policy');
      expect(topicConfig.configEntries[0].value).toBe('compact');
    });
  });

  describe('Error Handling Types', () => {
    it('should define KafkaError with all required properties', () => {
      const error: KafkaError = {
        name: 'KafkaError',
        message: 'Failed to connect to broker',
        type: 'CONNECTION_ERROR',
        code: 'ECONNREFUSED',
        retriable: true,
        broker: 'localhost:9092',
        topic: 'test-topic',
        partition: 0,
        cause: new Error('Connection refused')
      };

      expect(error).toBeDefined();
      expect(error.type).toBe('CONNECTION_ERROR');
      expect(error.retriable).toBe(true);
      expect(error.broker).toBe('localhost:9092');
    });

    it('should define KafkaDeadLetterQueueMessage with all required properties', () => {
      // Create a mock message that failed processing
      const originalMessage: KafkaMessage<{ test: string }> = {
        topic: 'test-topic',
        partition: 0,
        key: 'test-key',
        value: { test: 'value' },
        headers: { 'content-type': 'application/json' },
        timestamp: '1234567890',
        offset: '100'
      };

      // Create a DLQ message
      const dlqMessage: KafkaDeadLetterQueueMessage<{ test: string }> = {
        originalMessage,
        error: {
          message: 'Failed to process message',
          name: 'ProcessingError',
          stack: 'Error: Failed to process message\n    at processMessage (/app/src/consumer.ts:42:7)',
          code: 'ERR_PROCESSING',
          details: { reason: 'Invalid data format' }
        },
        attempts: 3,
        timestamp: new Date().toISOString(),
        consumerGroup: 'test-consumer-group',
        metadata: {
          lastAttemptTimestamp: new Date().toISOString(),
          processingTimeMs: 150
        }
      };

      expect(dlqMessage).toBeDefined();
      expect(dlqMessage.originalMessage).toEqual(originalMessage);
      expect(dlqMessage.error.name).toBe('ProcessingError');
      expect(dlqMessage.attempts).toBe(3);
      expect(dlqMessage.consumerGroup).toBe('test-consumer-group');
    });
  });

  describe('Validation Types', () => {
    it('should define KafkaValidationOptions with all required properties', () => {
      const options: KafkaValidationOptions = {
        validateStructure: true,
        validateHeaders: true,
        validatePayload: true,
        throwOnError: true,
        requiredHeaders: ['content-type', 'event-type'],
        schema: { type: 'object', properties: { test: { type: 'string' } } },
        customValidator: (message) => ({ isValid: true, errors: [] })
      };

      expect(options).toBeDefined();
      expect(options.validateStructure).toBe(true);
      expect(options.requiredHeaders).toContain('content-type');
      expect(options.schema).toBeDefined();
    });

    it('should define KafkaValidationResult with all required properties', () => {
      // Create a mock message
      const message: KafkaMessage<{ test: string }> = {
        topic: 'test-topic',
        partition: 0,
        key: 'test-key',
        value: { test: 'value' },
        headers: { 'content-type': 'application/json' }
      };

      // Create a validation result
      const result: KafkaValidationResult = {
        isValid: true,
        errors: [],
        message,
        structureValid: true,
        headersValid: true,
        payloadValid: true,
        metadata: { validatedAt: new Date().toISOString() }
      };

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.message).toEqual(message);
      expect(result.structureValid).toBe(true);
      expect(result.headersValid).toBe(true);
      expect(result.payloadValid).toBe(true);
    });
  });

  describe('Utility Types', () => {
    it('should define KafkaMessagePayload utility type', () => {
      // Type assertion test
      type TestPayload = { test: string };
      type ExtractedPayload = KafkaMessagePayload<KafkaMessage<TestPayload>>;

      // Create a value of the extracted type
      const payload: ExtractedPayload = { test: 'value' };

      expect(payload).toEqual({ test: 'value' });
    });

    it('should define ToKafkaMessage utility type', () => {
      // Type assertion test
      type TestPayload = { test: string };
      type KafkaMessageType = ToKafkaMessage<TestPayload>;

      // Create a value of the converted type
      const message: KafkaMessageType = {
        topic: 'test-topic',
        partition: 0,
        key: 'test-key',
        value: { test: 'value' },
        headers: { 'content-type': 'application/json' }
      };

      expect(message.value).toEqual({ test: 'value' });
    });

    it('should define FromKafkaMessage utility type', () => {
      // Type assertion test
      type TestPayload = { test: string };
      type KafkaMessageType = KafkaMessage<TestPayload>;
      type ExtractedPayload = FromKafkaMessage<KafkaMessageType>;

      // Create a value of the extracted type
      const payload: ExtractedPayload = { test: 'value' };

      expect(payload).toEqual({ test: 'value' });
    });

    it('should define KafkaClient interface with all required properties', () => {
      // Mock KafkaJS components
      const mockConsumer = {} as Consumer;
      const mockProducer = {} as Producer;
      const mockAdmin = {} as Admin;

      // Create a mock client
      const client: KafkaClient = {
        consumer: mockConsumer,
        producer: mockProducer,
        admin: mockAdmin,
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        isConnected: true,
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined)
      };

      expect(client).toBeDefined();
      expect(client.clientId).toBe('test-client');
      expect(client.brokers).toEqual(['localhost:9092']);
      expect(client.isConnected).toBe(true);
      expect(client.connect).toBeDefined();
      expect(client.disconnect).toBeDefined();
    });

    it('should define KafkaHealthStatus interface with all required properties', () => {
      // Create a mock health status
      const healthStatus: KafkaHealthStatus = {
        isHealthy: true,
        details: {
          consumer: true,
          producer: true,
          admin: true,
          brokers: [
            { id: 'broker-1', connected: true },
            { id: 'broker-2', connected: true }
          ]
        },
        timestamp: new Date().toISOString()
      };

      expect(healthStatus).toBeDefined();
      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.details.consumer).toBe(true);
      expect(healthStatus.details.producer).toBe(true);
      expect(healthStatus.details.admin).toBe(true);
      expect(healthStatus.details.brokers.length).toBe(2);
      expect(healthStatus.details.brokers[0].connected).toBe(true);
    });
  });

  describe('Journey-Specific Type Integration', () => {
    it('should support Health journey events', () => {
      // Create a mock health event
      const healthEvent: MockHealthEvent = {
        eventId: '123',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journey: JourneyType.HEALTH,
        userId: 'user-123',
        payload: {
          metricValue: 120,
          metricType: 'BLOOD_PRESSURE'
        }
      };

      // Create a Kafka message with the health event
      const message: KafkaEventMessage<MockHealthEvent> = {
        topic: 'health-events',
        partition: 0,
        key: healthEvent.userId,
        value: healthEvent,
        headers: {
          'event-type': healthEvent.type,
          'journey': healthEvent.journey
        }
      };

      expect(message).toBeDefined();
      expect(message.value.journey).toBe(JourneyType.HEALTH);
      expect(message.value.payload.metricType).toBe('BLOOD_PRESSURE');
    });

    it('should support Care journey events', () => {
      // Create a mock care event
      const careEvent: MockCareEvent = {
        eventId: '456',
        type: 'APPOINTMENT_BOOKED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journey: JourneyType.CARE,
        userId: 'user-456',
        payload: {
          appointmentId: 'appt-123',
          providerId: 'provider-789'
        }
      };

      // Create a Kafka message with the care event
      const message: KafkaEventMessage<MockCareEvent> = {
        topic: 'care-events',
        partition: 0,
        key: careEvent.userId,
        value: careEvent,
        headers: {
          'event-type': careEvent.type,
          'journey': careEvent.journey
        }
      };

      expect(message).toBeDefined();
      expect(message.value.journey).toBe(JourneyType.CARE);
      expect(message.value.payload.appointmentId).toBe('appt-123');
    });

    it('should support Plan journey events', () => {
      // Create a mock plan event
      const planEvent: MockPlanEvent = {
        eventId: '789',
        type: 'CLAIM_SUBMITTED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        journey: JourneyType.PLAN,
        userId: 'user-789',
        payload: {
          claimId: 'claim-456',
          amount: 150.75
        }
      };

      // Create a Kafka message with the plan event
      const message: KafkaEventMessage<MockPlanEvent> = {
        topic: 'plan-events',
        partition: 0,
        key: planEvent.userId,
        value: planEvent,
        headers: {
          'event-type': planEvent.type,
          'journey': planEvent.journey
        }
      };

      expect(message).toBeDefined();
      expect(message.value.journey).toBe(JourneyType.PLAN);
      expect(message.value.payload.claimId).toBe('claim-456');
      expect(message.value.payload.amount).toBe(150.75);
    });

    it('should support cross-journey event processing', () => {
      // Create events from different journeys
      const healthEvent: MockHealthEvent = {
        eventId: '123',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journey: JourneyType.HEALTH,
        userId: 'user-123',
        payload: {
          metricValue: 120,
          metricType: 'BLOOD_PRESSURE'
        }
      };

      const careEvent: MockCareEvent = {
        eventId: '456',
        type: 'APPOINTMENT_BOOKED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journey: JourneyType.CARE,
        userId: 'user-123', // Same user across journeys
        payload: {
          appointmentId: 'appt-123',
          providerId: 'provider-789'
        }
      };

      // Create Kafka messages for both events
      const healthMessage: KafkaEventMessage<MockHealthEvent> = {
        topic: 'health-events',
        partition: 0,
        key: healthEvent.userId,
        value: healthEvent,
        headers: {
          'event-type': healthEvent.type,
          'journey': healthEvent.journey
        }
      };

      const careMessage: KafkaEventMessage<MockCareEvent> = {
        topic: 'care-events',
        partition: 0,
        key: careEvent.userId,
        value: careEvent,
        headers: {
          'event-type': careEvent.type,
          'journey': careEvent.journey
        }
      };

      // Define a handler that can process events from any journey
      const crossJourneyHandler = (message: KafkaEventMessage<BaseEvent>) => {
        const event = message.value;
        
        // Process based on journey type
        switch (event.journey) {
          case JourneyType.HEALTH:
            expect(event.type).toBe('HEALTH_METRIC_RECORDED');
            break;
          case JourneyType.CARE:
            expect(event.type).toBe('APPOINTMENT_BOOKED');
            break;
          case JourneyType.PLAN:
            expect(event.type).toBe('CLAIM_SUBMITTED');
            break;
          default:
            fail('Unknown journey type');
        }

        // Verify common properties across all journeys
        expect(event.userId).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.source).toBeDefined();
      };

      // Process both messages
      crossJourneyHandler(healthMessage as KafkaEventMessage<BaseEvent>);
      crossJourneyHandler(careMessage as KafkaEventMessage<BaseEvent>);

      // This is just a type assertion test, no actual assertion needed
      expect(crossJourneyHandler).toBeDefined();
    });
  });
});
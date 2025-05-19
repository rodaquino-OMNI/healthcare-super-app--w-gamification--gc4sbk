import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Consumer, Kafka, Producer, logLevel } from 'kafkajs';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { TracingService } from '../../../src/tracing';
import {
  EventValidationError,
  KafkaConnectionError,
  KafkaConsumerError,
  KafkaProducerError,
  KafkaSerializationError,
} from '../../../src/kafka/kafka.errors';
import { KafkaErrorCode } from '../../../src/kafka/kafka.constants';
import { IKafkaConsumerOptions, IKafkaProducerOptions, IValidationResult } from '../../../src/kafka/kafka.interfaces';

// Mock KafkaJS
jest.mock('kafkajs');

// Mock TracingService
const mockTracingService = {
  createSpan: jest.fn((name, callback) => callback({})),
  getTraceContext: jest.fn(() => ({
    'trace-id': 'test-trace-id',
    'span-id': 'test-span-id',
  })),
  setTraceContext: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key, defaultValue) => {
    const config = {
      'service.name': 'test-service',
      'kafka.brokers': 'localhost:9092',
      'kafka.clientId': 'test-client',
      'kafka.groupId': 'test-group',
      'kafka.ssl': false,
      'kafka.sasl.enabled': false,
      'kafka.sasl.mechanism': 'plain',
      'kafka.sasl.username': 'user',
      'kafka.sasl.password': 'pass',
      'kafka.retry.initialRetryTime': 300,
      'kafka.retry.retries': 10,
      'kafka.retry.factor': 2,
      'kafka.retry.maxRetryTime': 30000,
      'kafka.connectionTimeout': 3000,
      'kafka.requestTimeout': 30000,
      'kafka.logLevel': logLevel.ERROR,
      'kafka.allowAutoTopicCreation': true,
      'kafka.idempotent': true,
      'kafka.maxInFlightRequests': 5,
      'kafka.sessionTimeout': 30000,
      'kafka.heartbeatInterval': 3000,
      'test-service.kafka.brokers': 'test-broker:9092',
      'test-service.kafka.clientId': 'test-service-client',
      'test-service.kafka.groupId': 'test-service-group',
    };
    return config[key] || defaultValue;
  }),
};

// Mock Kafka producer
const mockProducer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, errorCode: 0 }]),
};

// Mock Kafka consumer
const mockConsumer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
  commitOffsets: jest.fn().mockResolvedValue(undefined),
};

// Mock Kafka instance
const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
  consumer: jest.fn().mockReturnValue(mockConsumer),
};

// Mock Kafka constructor
(Kafka as jest.Mock).mockImplementation(() => mockKafka);

describe('KafkaService', () => {
  let service: KafkaService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        KafkaService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TracingService, useValue: mockTracingService },
      ],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(Kafka).toHaveBeenCalledWith({
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        ssl: false,
        sasl: undefined,
        retry: {
          initialRetryTime: 300,
          retries: 10,
          factor: 2,
          maxRetryTime: 30000,
          multiplier: 1.5,
        },
        logLevel: logLevel.ERROR,
        connectionTimeout: 3000,
        requestTimeout: 30000,
      });
    });

    it('should initialize with service-specific configuration', () => {
      // Reset mocks
      jest.clearAllMocks();

      // Create a new service with service-specific config namespace
      const configService = {
        ...mockConfigService,
        get: jest.fn((key, defaultValue) => {
          if (key === 'kafka.configNamespace') return 'test-service';
          return mockConfigService.get(key, defaultValue);
        }),
      };

      const kafkaService = new KafkaService(configService as any, mockTracingService as any);

      expect(Kafka).toHaveBeenCalledWith({
        clientId: 'test-service-client',
        brokers: ['test-broker:9092'],
        ssl: false,
        sasl: undefined,
        retry: expect.any(Object),
        logLevel: logLevel.ERROR,
        connectionTimeout: 3000,
        requestTimeout: 30000,
      });
    });

    it('should initialize with SASL configuration when enabled', () => {
      // Reset mocks
      jest.clearAllMocks();

      // Create a new service with SASL enabled
      const configService = {
        ...mockConfigService,
        get: jest.fn((key, defaultValue) => {
          if (key === 'kafka.sasl.enabled') return true;
          return mockConfigService.get(key, defaultValue);
        }),
      };

      const kafkaService = new KafkaService(configService as any, mockTracingService as any);

      expect(Kafka).toHaveBeenCalledWith({
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        ssl: false,
        sasl: {
          mechanism: 'plain',
          username: 'user',
          password: 'pass',
        },
        retry: expect.any(Object),
        logLevel: logLevel.ERROR,
        connectionTimeout: 3000,
        requestTimeout: 30000,
      });
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should connect producer on module init', async () => {
      await service.onModuleInit();
      expect(mockProducer.connect).toHaveBeenCalled();
    });

    it('should disconnect producer and consumers on module destroy', async () => {
      // Add a consumer to the map
      (service as any).consumers.set('test-topic-test-group', mockConsumer);

      await service.onModuleDestroy();

      expect(mockProducer.disconnect).toHaveBeenCalled();
      expect(mockConsumer.disconnect).toHaveBeenCalled();
    });

    it('should handle errors during initialization', async () => {
      // Mock producer connect to throw error
      mockProducer.connect.mockRejectedValueOnce(new Error('Connection error'));

      await expect(service.onModuleInit()).rejects.toThrow(KafkaConnectionError);
      expect(mockProducer.connect).toHaveBeenCalled();
    });

    it('should log errors during shutdown but not throw', async () => {
      // Mock producer disconnect to throw error
      mockProducer.disconnect.mockRejectedValueOnce(new Error('Disconnect error'));

      // Mock console.error to verify logging
      const consoleSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await service.onModuleDestroy();

      expect(mockProducer.disconnect).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Message Production', () => {
    beforeEach(async () => {
      // Initialize the service
      await service.onModuleInit();
    });

    it('should produce a message to a topic', async () => {
      const message = { test: 'data' };
      await service.produce('test-topic', message);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: undefined,
            headers: expect.any(Object),
          },
        ],
        acks: -1,
        timeout: undefined,
      });

      // Verify the message was serialized correctly
      const call = mockProducer.send.mock.calls[0][0];
      const sentValue = JSON.parse(call.messages[0].value.toString());
      expect(sentValue).toEqual(message);
    });

    it('should produce a message with a key', async () => {
      const message = { test: 'data' };
      const key = 'test-key';
      await service.produce('test-topic', message, key);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: key,
            headers: expect.any(Object),
          },
        ],
        acks: -1,
        timeout: undefined,
      });
    });

    it('should produce a message with headers', async () => {
      const message = { test: 'data' };
      const headers = { 'custom-header': 'value' };
      await service.produce('test-topic', message, undefined, headers);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: undefined,
            headers: expect.objectContaining({
              'custom-header': 'value',
              'x-service-name': 'test-service',
              'x-timestamp': expect.any(String),
              'x-trace-trace-id': 'test-trace-id',
              'x-trace-span-id': 'test-span-id',
            }),
          },
        ],
        acks: -1,
        timeout: undefined,
      });
    });

    it('should produce a message with custom serializer', async () => {
      const message = { test: 'data' };
      const serializer = (msg: any) => Buffer.from(`custom:${JSON.stringify(msg)}`);
      const options: IKafkaProducerOptions = { serializer };

      await service.produce('test-topic', message, undefined, undefined, options);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: undefined,
            headers: expect.any(Object),
          },
        ],
        acks: -1,
        timeout: undefined,
      });

      // Verify the message was serialized with the custom serializer
      const call = mockProducer.send.mock.calls[0][0];
      const sentValue = call.messages[0].value.toString();
      expect(sentValue).toEqual(`custom:${JSON.stringify(message)}`);
    });

    it('should validate messages before producing', async () => {
      const message = { test: 'data' };
      const validator = jest.fn().mockResolvedValue({ isValid: true });
      const options: IKafkaProducerOptions = { validator };

      await service.produce('test-topic', message, undefined, undefined, options);

      expect(validator).toHaveBeenCalledWith(message);
      expect(mockProducer.send).toHaveBeenCalled();
    });

    it('should throw validation error for invalid messages', async () => {
      const message = { test: 'data' };
      const validator = jest.fn().mockResolvedValue({ isValid: false, error: 'Validation failed' });
      const options: IKafkaProducerOptions = { validator };

      await expect(service.produce('test-topic', message, undefined, undefined, options)).rejects.toThrow(
        EventValidationError
      );

      expect(validator).toHaveBeenCalledWith(message);
      expect(mockProducer.send).not.toHaveBeenCalled();
    });

    it('should produce a batch of messages', async () => {
      const messages = [
        { value: { id: 1, name: 'test1' }, key: 'key1', headers: { 'header1': 'value1' } },
        { value: { id: 2, name: 'test2' }, key: 'key2', headers: { 'header2': 'value2' } },
      ];

      await service.produceBatch('test-topic', messages);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: 'key1',
            headers: expect.objectContaining({
              'header1': 'value1',
              'x-service-name': 'test-service',
              'x-timestamp': expect.any(String),
            }),
          },
          {
            value: expect.any(Buffer),
            key: 'key2',
            headers: expect.objectContaining({
              'header2': 'value2',
              'x-service-name': 'test-service',
              'x-timestamp': expect.any(String),
            }),
          },
        ],
        acks: -1,
        timeout: undefined,
      });
    });

    it('should handle producer errors', async () => {
      // Mock producer send to throw error
      mockProducer.send.mockRejectedValueOnce(new Error('Send error'));

      await expect(service.produce('test-topic', { test: 'data' })).rejects.toThrow(KafkaProducerError);
      expect(mockProducer.send).toHaveBeenCalled();
    });

    it('should use a producer from the pool if producerId is provided', async () => {
      const poolProducer = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        send: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, errorCode: 0 }]),
      };

      // Mock the getOrCreateProducer method
      jest.spyOn(service as any, 'getOrCreateProducer').mockResolvedValue(poolProducer);

      const message = { test: 'data' };
      const options: IKafkaProducerOptions = { producerId: 'custom-producer' };

      await service.produce('test-topic', message, undefined, undefined, options);

      expect((service as any).getOrCreateProducer).toHaveBeenCalledWith('custom-producer', undefined);
      expect(poolProducer.send).toHaveBeenCalled();
      expect(mockProducer.send).not.toHaveBeenCalled();
    });
  });

  describe('Message Consumption', () => {
    beforeEach(async () => {
      // Initialize the service
      await service.onModuleInit();
    });

    it('should consume messages from a topic', async () => {
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);

      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'test-topic',
        fromBeginning: false,
      });
      expect(mockConsumer.run).toHaveBeenCalled();
      expect((service as any).consumers.has('test-topic-test-group')).toBe(true);
    });

    it('should use default consumer group if not provided', async () => {
      const callback = jest.fn();
      await service.consume('test-topic', undefined, callback);

      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'test-topic',
        fromBeginning: false,
      });
      expect((service as any).consumers.has('test-topic-test-service-consumer-group')).toBe(true);
    });

    it('should consume messages with custom options', async () => {
      const callback = jest.fn();
      const options: IKafkaConsumerOptions = {
        fromBeginning: true,
        maxBytes: 2048000,
        sessionTimeout: 60000,
      };

      await service.consume('test-topic', 'test-group', callback, options);

      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'test-topic',
        fromBeginning: true,
      });

      // Verify consumer was created with custom options
      expect(mockKafka.consumer).toHaveBeenCalledWith(expect.objectContaining({
        groupId: 'test-group',
        sessionTimeout: 60000,
        maxBytes: 2048000,
      }));
    });

    it('should handle consumer errors', async () => {
      // Mock consumer connect to throw error
      mockConsumer.connect.mockRejectedValueOnce(new Error('Consumer connection error'));

      const callback = jest.fn();
      await expect(service.consume('test-topic', 'test-group', callback)).rejects.toThrow(KafkaConsumerError);

      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).not.toHaveBeenCalled();
      expect(mockConsumer.run).not.toHaveBeenCalled();
    });

    it('should process messages with the callback', async () => {
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);

      // Get the eachMessage handler
      const runCall = mockConsumer.run.mock.calls[0][0];
      const eachMessageHandler = runCall.eachMessage;

      // Create a mock message
      const mockMessage = {
        topic: 'test-topic',
        partition: 0,
        message: {
          key: Buffer.from('test-key'),
          value: Buffer.from(JSON.stringify({ test: 'data' })),
          headers: {
            'test-header': Buffer.from('test-value'),
          },
          offset: '0',
          timestamp: '1630000000000',
        },
      };

      // Call the handler
      await eachMessageHandler(mockMessage);

      // Verify callback was called with deserialized message
      expect(callback).toHaveBeenCalledWith(
        { test: 'data' },
        'test-key',
        { 'test-header': 'test-value' }
      );
    });

    it('should handle message processing errors and send to DLQ', async () => {
      // Mock the sendToDeadLetterQueue method
      const sendToDLQSpy = jest.spyOn(service, 'sendToDeadLetterQueue').mockResolvedValue(undefined);

      const callback = jest.fn().mockRejectedValue(new Error('Processing error'));
      const options: IKafkaConsumerOptions = {
        deadLetterQueue: {
          enabled: true,
          maxRetries: 1,
        },
      };

      await service.consume('test-topic', 'test-group', callback, options);

      // Get the eachMessage handler
      const runCall = mockConsumer.run.mock.calls[0][0];
      const eachMessageHandler = runCall.eachMessage;

      // Create a mock message
      const mockMessage = {
        topic: 'test-topic',
        partition: 0,
        message: {
          key: Buffer.from('test-key'),
          value: Buffer.from(JSON.stringify({ test: 'data' })),
          headers: {
            'x-retry-count': Buffer.from('1'), // Already retried once
          },
          offset: '0',
          timestamp: '1630000000000',
        },
      };

      // Call the handler
      await eachMessageHandler(mockMessage);

      // Verify callback was called and error was handled
      expect(callback).toHaveBeenCalled();
      expect(sendToDLQSpy).toHaveBeenCalled();
    });

    it('should retry messages before sending to DLQ', async () => {
      // Mock the produce method for retries
      const produceSpy = jest.spyOn(service, 'produce').mockResolvedValue();

      const callback = jest.fn().mockRejectedValue(new Error('Processing error'));
      const options: IKafkaConsumerOptions = {
        deadLetterQueue: {
          enabled: true,
          retryEnabled: true,
          maxRetries: 3,
        },
      };

      await service.consume('test-topic', 'test-group', callback, options);

      // Get the eachMessage handler
      const runCall = mockConsumer.run.mock.calls[0][0];
      const eachMessageHandler = runCall.eachMessage;

      // Create a mock message with no previous retries
      const mockMessage = {
        topic: 'test-topic',
        partition: 0,
        message: {
          key: Buffer.from('test-key'),
          value: Buffer.from(JSON.stringify({ test: 'data' })),
          headers: {},
          offset: '0',
          timestamp: '1630000000000',
        },
      };

      // Call the handler
      await eachMessageHandler(mockMessage);

      // Verify callback was called and message was sent to retry topic
      expect(callback).toHaveBeenCalled();
      expect(produceSpy).toHaveBeenCalledWith(
        'test-topic.retry',
        expect.any(Object),
        'test-key',
        expect.objectContaining({
          'x-retry-count': '1',
          'x-original-topic': 'test-topic',
        })
      );
    });

    it('should consume from retry topics', async () => {
      const callback = jest.fn();
      await service.consumeRetry('test-topic', 'test-group', callback);

      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'test-topic.retry',
        fromBeginning: false,
      });
    });

    it('should consume from dead letter queue topics', async () => {
      const callback = jest.fn();
      await service.consumeDeadLetterQueue('test-topic', 'test-group', callback);

      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'test-topic.dlq',
        fromBeginning: false,
      });
    });
  });

  describe('Dead Letter Queue', () => {
    beforeEach(async () => {
      // Initialize the service
      await service.onModuleInit();
    });

    it('should send messages to dead letter queue', async () => {
      // Mock the produce method
      const produceSpy = jest.spyOn(service, 'produce').mockResolvedValue();

      const originalTopic = 'test-topic';
      const message = { test: 'data' };
      const error = new Error('Processing error');
      const metadata = { retryCount: 3, key: 'test-key' };

      await service.sendToDeadLetterQueue(originalTopic, message, error, metadata);

      expect(produceSpy).toHaveBeenCalledWith(
        'test-topic.dlq',
        expect.objectContaining({
          originalMessage: message,
          error: expect.objectContaining({
            name: 'Error',
            message: 'Processing error',
          }),
          metadata: expect.objectContaining({
            originalTopic,
            retryCount: 3,
            key: 'test-key',
            serviceName: 'test-service',
          }),
        }),
        metadata.key,
        expect.objectContaining({
          'x-original-topic': originalTopic,
          'x-error-type': 'Error',
          'x-retry-count': '3',
        })
      );
    });

    it('should handle errors when sending to DLQ', async () => {
      // Mock the produce method to throw an error
      jest.spyOn(service, 'produce').mockRejectedValue(new Error('DLQ error'));

      // Mock console.error to verify logging
      const consoleSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const originalTopic = 'test-topic';
      const message = { test: 'data' };
      const error = new Error('Processing error');

      // Should not throw even if produce fails
      await service.sendToDeadLetterQueue(originalTopic, message, error);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use custom DLQ topic if provided', async () => {
      // Mock the produce method
      const produceSpy = jest.spyOn(service, 'produce').mockResolvedValue();

      const originalTopic = 'test-topic';
      const message = { test: 'data' };
      const error = new Error('Processing error');
      const config = { topic: 'custom-dlq-topic' };

      await service.sendToDeadLetterQueue(originalTopic, message, error, {}, config);

      expect(produceSpy).toHaveBeenCalledWith(
        'custom-dlq-topic',
        expect.any(Object),
        undefined,
        expect.any(Object)
      );
    });
  });

  describe('Serialization/Deserialization', () => {
    it('should serialize messages to JSON by default', () => {
      const message = { test: 'data' };
      const result = (service as any).serializeMessage(message);

      expect(result).toBeInstanceOf(Buffer);
      expect(JSON.parse(result.toString())).toEqual(message);
    });

    it('should use custom serializer if provided', () => {
      const message = { test: 'data' };
      const serializer = (msg: any) => Buffer.from(`custom:${JSON.stringify(msg)}`);
      const result = (service as any).serializeMessage(message, serializer);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toEqual(`custom:${JSON.stringify(message)}`);
    });

    it('should handle serialization errors', () => {
      const message = { test: 'data' };
      const serializer = () => { throw new Error('Serialization error'); };

      expect(() => (service as any).serializeMessage(message, serializer)).toThrow(KafkaSerializationError);
    });

    it('should deserialize messages from JSON by default', () => {
      const message = { test: 'data' };
      const buffer = Buffer.from(JSON.stringify(message));
      const result = (service as any).deserializeMessage(buffer);

      expect(result).toEqual(message);
    });

    it('should use custom deserializer if provided', () => {
      const message = { test: 'data' };
      const buffer = Buffer.from(`custom:${JSON.stringify(message)}`);
      const deserializer = (buf: Buffer) => {
        const str = buf.toString();
        return JSON.parse(str.replace('custom:', ''));
      };
      const result = (service as any).deserializeMessage(buffer, deserializer);

      expect(result).toEqual(message);
    });

    it('should handle deserialization errors', () => {
      const buffer = Buffer.from('invalid json');

      expect(() => (service as any).deserializeMessage(buffer)).toThrow(KafkaSerializationError);
    });

    it('should parse headers from binary to string', () => {
      const headers = {
        'test-header': Buffer.from('test-value'),
        'empty-header': null,
      };

      const result = (service as any).parseHeaders(headers);

      expect(result).toEqual({
        'test-header': 'test-value',
      });
    });
  });

  describe('Connection Pooling', () => {
    beforeEach(async () => {
      // Initialize the service
      await service.onModuleInit();
    });

    it('should create and cache producers in the pool', async () => {
      // Create a new producer for the pool
      const poolProducer = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        send: jest.fn().mockResolvedValue([]),
      };

      // Mock Kafka producer to return our pool producer
      mockKafka.producer.mockReturnValueOnce(poolProducer);

      // Call getOrCreateProducer directly
      const producerId = 'test-producer';
      const producer1 = await (service as any).getOrCreateProducer(producerId);

      expect(producer1).toBe(poolProducer);
      expect(mockKafka.producer).toHaveBeenCalled();
      expect(poolProducer.connect).toHaveBeenCalled();
      expect((service as any).producerPool.get(producerId)).toBe(poolProducer);

      // Reset mocks for second call
      mockKafka.producer.mockClear();
      poolProducer.connect.mockClear();

      // Call again with same ID - should return cached producer
      const producer2 = await (service as any).getOrCreateProducer(producerId);

      expect(producer2).toBe(poolProducer);
      expect(mockKafka.producer).not.toHaveBeenCalled();
      expect(poolProducer.connect).not.toHaveBeenCalled();
    });

    it('should handle errors when creating producers', async () => {
      // Create a new producer for the pool that fails to connect
      const poolProducer = {
        connect: jest.fn().mockRejectedValue(new Error('Connection error')),
        disconnect: jest.fn().mockResolvedValue(undefined),
      };

      // Mock Kafka producer to return our pool producer
      mockKafka.producer.mockReturnValueOnce(poolProducer);

      // Call getOrCreateProducer directly
      const producerId = 'test-producer';
      await expect((service as any).getOrCreateProducer(producerId)).rejects.toThrow(KafkaConnectionError);

      expect(mockKafka.producer).toHaveBeenCalled();
      expect(poolProducer.connect).toHaveBeenCalled();
      expect((service as any).producerPool.has(producerId)).toBe(false);
    });

    it('should disconnect all producers in the pool on module destroy', async () => {
      // Create two producers for the pool
      const poolProducer1 = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
      };

      const poolProducer2 = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
      };

      // Add producers to the pool
      (service as any).producerPool.set('producer1', poolProducer1);
      (service as any).producerPool.set('producer2', poolProducer2);

      await service.onModuleDestroy();

      expect(poolProducer1.disconnect).toHaveBeenCalled();
      expect(poolProducer2.disconnect).toHaveBeenCalled();
      expect((service as any).producerPool.size).toBe(0);
    });
  });

  describe('Tracing Integration', () => {
    beforeEach(async () => {
      // Initialize the service
      await service.onModuleInit();
    });

    it('should create spans for produce operations', async () => {
      const message = { test: 'data' };
      await service.produce('test-topic', message);

      expect(mockTracingService.createSpan).toHaveBeenCalledWith(
        'kafka.produce.test-topic',
        expect.any(Function)
      );
    });

    it('should add trace context to message headers', async () => {
      const message = { test: 'data' };
      await service.produce('test-topic', message);

      expect(mockTracingService.getTraceContext).toHaveBeenCalled();

      // Verify headers in the sent message
      const call = mockProducer.send.mock.calls[0][0];
      const headers = call.messages[0].headers;

      expect(headers).toEqual(expect.objectContaining({
        'x-trace-trace-id': 'test-trace-id',
        'x-trace-span-id': 'test-span-id',
        'x-service-name': 'test-service',
        'x-timestamp': expect.any(String),
      }));
    });

    it('should extract trace context from message headers during consumption', async () => {
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);

      // Get the eachMessage handler
      const runCall = mockConsumer.run.mock.calls[0][0];
      const eachMessageHandler = runCall.eachMessage;

      // Create a mock message with trace headers
      const mockMessage = {
        topic: 'test-topic',
        partition: 0,
        message: {
          key: Buffer.from('test-key'),
          value: Buffer.from(JSON.stringify({ test: 'data' })),
          headers: {
            'x-trace-trace-id': Buffer.from('incoming-trace-id'),
            'x-trace-span-id': Buffer.from('incoming-span-id'),
          },
          offset: '0',
          timestamp: '1630000000000',
        },
      };

      // Call the handler
      await eachMessageHandler(mockMessage);

      // Verify trace context was extracted and set
      expect(mockTracingService.setTraceContext).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'trace-id': 'incoming-trace-id',
          'span-id': 'incoming-span-id',
        })
      );
    });
  });
});
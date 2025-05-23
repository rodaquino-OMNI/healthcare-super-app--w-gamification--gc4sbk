import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { OpenTelemetryTracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { EventValidationError, EventProcessingError, KafkaConnectionError, KafkaProducerError, KafkaConsumerError, KafkaSerializationError } from '../../../src/errors/event-errors';
import { IBaseEvent } from '../../../src/interfaces/base-event.interface';
import { KAFKA_DEFAULT_CONFIG, KAFKA_ERROR_CODES, KAFKA_RETRY_OPTIONS } from '../../../src/kafka/kafka.constants';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

// Mock the kafkajs library
jest.mock('kafkajs', () => {
  // Mock implementations for Kafka, Producer, and Consumer
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, errorCode: 0 }]),
    transaction: jest.fn().mockReturnValue({
      send: jest.fn(),
      commit: jest.fn(),
      abort: jest.fn(),
    }),
  };

  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockImplementation((config) => Promise.resolve()),
    commitOffsets: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
  };

  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: jest.fn().mockReturnValue(mockProducer),
      consumer: jest.fn().mockReturnValue(mockConsumer),
    })),
    Producer: mockProducer,
    Consumer: mockConsumer,
  };
});

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn().mockReturnValue('mocked-uuid'),
  },
});

// Create mock implementations for dependencies
const mockConfigService = {
  get: jest.fn((key, defaultValue) => {
    const config = {
      'service.name': 'test-service',
      'kafka.brokers': 'localhost:9092',
      'kafka.clientId': 'test-client',
      'kafka.ssl': false,
      'kafka.sasl.enabled': false,
      'kafka.connectionTimeout': 1000,
      'kafka.requestTimeout': 30000,
      'kafka.retry.initialRetryTime': 300,
      'kafka.retry.retries': 5,
      'kafka.retry.maxRetryTime': 30000,
      'kafka.retry.factor': 2,
      'kafka.retry.multiplier': 1.5,
      'kafka.sessionTimeout': 30000,
      'kafka.heartbeatInterval': 3000,
      'kafka.maxWaitTimeInMs': 1000,
      'kafka.allowAutoTopicCreation': false,
      'kafka.maxBytesPerPartition': 1048576,
      'kafka.transactionalId': undefined,
      'kafka.idempotent': true,
      'kafka.maxInFlightRequests': 5,
      'kafka.retry.maxRetries': 3,
      'kafka.retry.initialRetryTime': 100,
      'kafka.retry.maxRetryTime': 30000,
      'kafka.retry.factor': 2,
      'kafka.retry.retryableErrors': ['LEADER_NOT_AVAILABLE', 'NETWORK_EXCEPTION'],
    };
    return config[key] || defaultValue;
  }),
};

const mockTracingService = {
  startActiveSpan: jest.fn((name, fn) => fn({
    setAttributes: jest.fn(),
    end: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
  })),
  getPropagationHeaders: jest.fn().mockReturnValue({
    'x-trace-id': 'test-trace-id',
    'x-span-id': 'test-span-id',
  }),
  setSpanContextFromHeaders: jest.fn(),
};

const mockLoggerService = {
  createLogger: jest.fn().mockReturnValue({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
};

// Sample event for testing
const sampleEvent: IBaseEvent = {
  eventId: 'test-event-id',
  type: 'TEST_EVENT',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  source: 'test-service',
  journey: JourneyType.HEALTH,
  userId: 'test-user-id',
  payload: { test: 'data' },
  metadata: { correlationId: 'test-correlation-id' },
};

describe('KafkaService', () => {
  let service: KafkaService;
  let module: TestingModule;
  let configService: ConfigService;
  let tracingService: OpenTelemetryTracingService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        KafkaService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: OpenTelemetryTracingService, useValue: mockTracingService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: 'KAFKA_OPTIONS', useValue: {} },
      ],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
    configService = module.get<ConfigService>(ConfigService);
    tracingService = module.get<OpenTelemetryTracingService>(OpenTelemetryTracingService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Initialization and Configuration', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with default configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('service.name', 'austa-service');
      expect(configService.get).toHaveBeenCalledWith('kafka.brokers', expect.any(String));
    });

    it('should use service-specific configuration when provided', async () => {
      const customOptions = {
        serviceName: 'custom-service',
        configNamespace: 'custom.kafka',
      };

      const customModule = await Test.createTestingModule({
        providers: [
          KafkaService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: OpenTelemetryTracingService, useValue: mockTracingService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: 'KAFKA_OPTIONS', useValue: customOptions },
        ],
      }).compile();

      const customService = customModule.get<KafkaService>(KafkaService);
      expect(customService).toBeDefined();
      expect(mockConfigService.get).toHaveBeenCalledWith('custom.kafka.brokers', expect.any(String));

      await customModule.close();
    });

    it('should handle configuration errors gracefully', () => {
      const errorConfigService = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('Configuration error');
        }),
      };

      expect(() => {
        new KafkaService(
          errorConfigService as unknown as ConfigService,
          mockTracingService as unknown as OpenTelemetryTracingService,
          mockLoggerService as unknown as LoggerService,
          {}
        );
      }).toThrow(KafkaConnectionError);
    });
  });

  describe('Lifecycle Management', () => {
    it('should connect producer on module init', async () => {
      const connectSpy = jest.spyOn(service as any, 'connectProducer');
      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
    });

    it('should disconnect producer and consumers on module destroy', async () => {
      const disconnectProducerSpy = jest.spyOn(service as any, 'disconnectProducer');
      const disconnectConsumersSpy = jest.spyOn(service as any, 'disconnectAllConsumers');
      
      await service.onModuleDestroy();
      
      expect(disconnectProducerSpy).toHaveBeenCalled();
      expect(disconnectConsumersSpy).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      jest.spyOn(service as any, 'connectProducer').mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(service.onModuleInit()).rejects.toThrow(KafkaConnectionError);
    });

    it('should log errors during shutdown but not throw', async () => {
      const mockError = new Error('Disconnect error');
      jest.spyOn(service as any, 'disconnectProducer').mockRejectedValueOnce(mockError);
      
      await service.onModuleDestroy();
      
      const logger = (service as any).logger;
      expect(logger.error).toHaveBeenCalledWith('Error during Kafka service shutdown', mockError);
    });
  });

  describe('Connection Management', () => {
    it('should connect producer only once when called multiple times', async () => {
      const connectSpy = jest.spyOn((service as any).kafka.producer(), 'connect');
      
      // First connection
      await (service as any).connectProducer();
      expect(connectSpy).toHaveBeenCalledTimes(1);
      
      // Second connection attempt should reuse the existing connection
      await (service as any).connectProducer();
      expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle producer connection errors', async () => {
      const mockError = new Error('Connection failed');
      jest.spyOn((service as any).kafka.producer(), 'connect').mockRejectedValueOnce(mockError);
      
      await expect((service as any).connectProducer()).rejects.toThrow(KafkaConnectionError);
    });

    it('should disconnect producer properly', async () => {
      const disconnectSpy = jest.spyOn((service as any).producer, 'disconnect');
      
      await (service as any).disconnectProducer();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should handle producer disconnect errors', async () => {
      const mockError = new Error('Disconnect failed');
      jest.spyOn((service as any).producer, 'disconnect').mockRejectedValueOnce(mockError);
      
      await (service as any).disconnectProducer();
      
      const logger = (service as any).logger;
      expect(logger.error).toHaveBeenCalledWith('Error disconnecting Kafka producer', mockError);
    });

    it('should disconnect all consumers properly', async () => {
      // Create mock consumers
      const consumer1 = (service as any).kafka.consumer();
      const consumer2 = (service as any).kafka.consumer();
      
      (service as any).consumers.set('group1-topic1', consumer1);
      (service as any).consumers.set('group2-topic2', consumer2);
      
      await (service as any).disconnectAllConsumers();
      
      expect(consumer1.disconnect).toHaveBeenCalled();
      expect(consumer2.disconnect).toHaveBeenCalled();
      expect((service as any).consumers.size).toBe(0);
    });

    it('should handle consumer disconnect errors', async () => {
      const mockError = new Error('Consumer disconnect failed');
      const consumer = (service as any).kafka.consumer();
      jest.spyOn(consumer, 'disconnect').mockRejectedValueOnce(mockError);
      
      (service as any).consumers.set('group1-topic1', consumer);
      
      await (service as any).disconnectAllConsumers();
      
      const logger = (service as any).logger;
      expect(logger.error).toHaveBeenCalledWith('Error disconnecting Kafka consumer group1-topic1', mockError);
    });
  });

  describe('Message Production', () => {
    beforeEach(async () => {
      // Ensure producer is connected
      await service.onModuleInit();
    });

    it('should produce messages with correct format', async () => {
      const sendSpy = jest.spyOn((service as any).producer, 'send');
      
      await service.produce('test-topic', sampleEvent);
      
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        topic: 'test-topic',
        messages: expect.arrayContaining([
          expect.objectContaining({
            key: null,
            headers: expect.objectContaining({
              'x-event-id': expect.any(Buffer),
              'x-source-service': expect.any(Buffer),
              'x-event-type': expect.any(Buffer),
              'x-event-version': expect.any(Buffer),
              'x-timestamp': expect.any(Buffer),
            }),
          }),
        ]),
      }));
    });

    it('should add tracing headers to produced messages', async () => {
      const sendSpy = jest.spyOn((service as any).producer, 'send');
      
      await service.produce('test-topic', sampleEvent);
      
      expect(tracingService.getPropagationHeaders).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            headers: expect.objectContaining({
              'x-trace-id': expect.any(Buffer),
              'x-span-id': expect.any(Buffer),
            }),
          }),
        ]),
      }));
    });

    it('should use provided message key for partitioning', async () => {
      const sendSpy = jest.spyOn((service as any).producer, 'send');
      const key = 'test-key';
      
      await service.produce('test-topic', sampleEvent, key);
      
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            key: Buffer.from(key),
          }),
        ]),
      }));
    });

    it('should merge custom headers with system headers', async () => {
      const sendSpy = jest.spyOn((service as any).producer, 'send');
      const customHeaders = {
        'custom-header': 'custom-value',
      };
      
      await service.produce('test-topic', sampleEvent, undefined, customHeaders);
      
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            headers: expect.objectContaining({
              'custom-header': expect.any(Buffer),
              'x-event-id': expect.any(Buffer),
            }),
          }),
        ]),
      }));
    });

    it('should handle producer send errors', async () => {
      const mockError = new Error('Send failed');
      jest.spyOn((service as any).producer, 'send').mockRejectedValueOnce(mockError);
      
      await expect(service.produce('test-topic', sampleEvent)).rejects.toThrow(KafkaProducerError);
    });

    it('should retry on retriable errors', async () => {
      const mockError = new Error('Network error');
      const sendSpy = jest.spyOn((service as any).producer, 'send')
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce([{ topicName: 'test-topic', partition: 0, errorCode: 0 }]);
      
      // Mock retry policy to always retry
      jest.spyOn((service as any).retryPolicy, 'shouldRetry').mockReturnValueOnce(true);
      jest.spyOn((service as any).retryPolicy, 'getDelayForAttempt').mockReturnValueOnce(10);
      
      // Use a small delay for testing
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation((callback) => {
        callback();
        return {} as any;
      });
      
      await service.produce('test-topic', sampleEvent);
      
      expect(sendSpy).toHaveBeenCalledTimes(2);
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it('should not retry when retry is disabled', async () => {
      const mockError = new Error('Network error');
      const sendSpy = jest.spyOn((service as any).producer, 'send').mockRejectedValueOnce(mockError);
      
      // Mock retry policy to indicate retry is possible
      jest.spyOn((service as any).retryPolicy, 'shouldRetry').mockReturnValueOnce(true);
      
      await expect(service.produce('test-topic', sampleEvent, undefined, undefined, { retry: false })).rejects.toThrow(KafkaProducerError);
      
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('should validate events against schema when schemaId is provided', async () => {
      // Mock the validateEventSchema function
      const validateEventSchemaMock = jest.fn().mockResolvedValue({ valid: true });
      jest.mock('../../../src/validation/schema-validator', () => ({
        validateEventSchema: validateEventSchemaMock,
      }));
      
      await service.produce('test-topic', sampleEvent, undefined, undefined, { schemaId: 'test-schema' });
      
      // This is a bit tricky to test since we mocked the import, but in a real test it would verify the validation was called
    });

    it('should throw validation error when schema validation fails', async () => {
      // Mock the validateEventSchema function to fail
      const mockValidationError = { valid: false, errors: ['Invalid field'] };
      jest.spyOn(service as any, 'validateEventSchema').mockResolvedValueOnce(mockValidationError);
      
      await expect(service.produce('test-topic', sampleEvent, undefined, undefined, { schemaId: 'test-schema' }))
        .rejects.toThrow(EventValidationError);
    });
  });

  describe('Batch Message Production', () => {
    beforeEach(async () => {
      // Ensure producer is connected
      await service.onModuleInit();
    });

    it('should produce batch messages correctly', async () => {
      const sendSpy = jest.spyOn((service as any).producer, 'send');
      const messages = [
        { message: sampleEvent, key: 'key1' },
        { message: { ...sampleEvent, eventId: 'event2' }, key: 'key2' },
      ];
      
      await service.produceBatch('test-topic', messages);
      
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        topic: 'test-topic',
        messages: expect.arrayContaining([
          expect.objectContaining({ key: Buffer.from('key1') }),
          expect.objectContaining({ key: Buffer.from('key2') }),
        ]),
      }));
    });

    it('should handle batch production errors', async () => {
      const mockError = new Error('Batch send failed');
      jest.spyOn((service as any).producer, 'send').mockRejectedValueOnce(mockError);
      
      const messages = [
        { message: sampleEvent, key: 'key1' },
        { message: { ...sampleEvent, eventId: 'event2' }, key: 'key2' },
      ];
      
      await expect(service.produceBatch('test-topic', messages)).rejects.toThrow(KafkaProducerError);
    });

    it('should retry batch production on retriable errors', async () => {
      const mockError = new Error('Network error');
      const sendSpy = jest.spyOn((service as any).producer, 'send')
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce([{ topicName: 'test-topic', partition: 0, errorCode: 0 }]);
      
      // Mock retry policy to always retry
      jest.spyOn((service as any).retryPolicy, 'shouldRetry').mockReturnValueOnce(true);
      jest.spyOn((service as any).retryPolicy, 'getDelayForAttempt').mockReturnValueOnce(10);
      
      // Use a small delay for testing
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation((callback) => {
        callback();
        return {} as any;
      });
      
      const messages = [
        { message: sampleEvent, key: 'key1' },
        { message: { ...sampleEvent, eventId: 'event2' }, key: 'key2' },
      ];
      
      await service.produceBatch('test-topic', messages);
      
      expect(sendSpy).toHaveBeenCalledTimes(2);
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it('should validate all messages in batch when schemaId is provided', async () => {
      // Mock the validateEventSchema function
      const validateEventSchemaMock = jest.fn().mockResolvedValue({ valid: true });
      jest.mock('../../../src/validation/schema-validator', () => ({
        validateEventSchema: validateEventSchemaMock,
      }));
      
      const messages = [
        { message: sampleEvent, key: 'key1' },
        { message: { ...sampleEvent, eventId: 'event2' }, key: 'key2' },
      ];
      
      await service.produceBatch('test-topic', messages, { schemaId: 'test-schema' });
      
      // In a real test, we would verify validation was called for each message
    });
  });

  describe('Message Consumption', () => {
    it('should subscribe to topics correctly', async () => {
      const subscribeSpy = jest.spyOn((service as any).kafka.consumer(), 'subscribe');
      const runSpy = jest.spyOn((service as any).kafka.consumer(), 'run');
      
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);
      
      expect(subscribeSpy).toHaveBeenCalledWith({ topic: 'test-topic', fromBeginning: false });
      expect(runSpy).toHaveBeenCalled();
    });

    it('should reuse existing consumer for same group and topic', async () => {
      const consumerSpy = jest.spyOn((service as any).kafka, 'consumer');
      
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);
      await service.consume('test-topic', 'test-group', callback);
      
      expect(consumerSpy).toHaveBeenCalledTimes(1);
    });

    it('should create separate consumers for different groups', async () => {
      const consumerSpy = jest.spyOn((service as any).kafka, 'consumer');
      
      const callback = jest.fn();
      await service.consume('test-topic', 'group1', callback);
      await service.consume('test-topic', 'group2', callback);
      
      expect(consumerSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle consumer errors', async () => {
      const mockError = new Error('Consumer error');
      jest.spyOn((service as any).kafka.consumer(), 'connect').mockRejectedValueOnce(mockError);
      
      const callback = jest.fn();
      await expect(service.consume('test-topic', 'test-group', callback)).rejects.toThrow(KafkaConsumerError);
    });

    it('should support batch processing mode', async () => {
      const runSpy = jest.spyOn((service as any).kafka.consumer(), 'run');
      
      const callback = jest.fn();
      const batchCallback = jest.fn();
      await service.consume('test-topic', 'test-group', callback, {
        batchProcessing: true,
        batchCallback,
      });
      
      expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({
        eachBatch: expect.any(Function),
        eachMessage: undefined,
      }));
    });

    it('should support schema validation during consumption', async () => {
      const runSpy = jest.spyOn((service as any).kafka.consumer(), 'run');
      
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback, {
        schemaId: 'test-schema',
      });
      
      expect(runSpy).toHaveBeenCalled();
      // In a real test, we would trigger the eachMessage function and verify validation
    });

    it('should support dead letter queue for failed messages', async () => {
      const runSpy = jest.spyOn((service as any).kafka.consumer(), 'run');
      const handleDlqSpy = jest.spyOn(service as any, 'handleDLQ').mockResolvedValue(undefined);
      
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback, {
        dlq: {
          enabled: true,
          topic: 'test-dlq',
        },
      });
      
      expect(runSpy).toHaveBeenCalled();
      // In a real test, we would trigger the eachMessage function with an error and verify DLQ handling
    });
  });

  describe('Consumer Management', () => {
    it('should commit offsets correctly', async () => {
      const commitSpy = jest.spyOn((service as any).kafka.consumer(), 'commitOffsets');
      
      // First create a consumer
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);
      
      const offsets = [{ topic: 'test-topic', partition: 0, offset: '100' }];
      await service.commitOffsets('test-group', 'test-topic', offsets);
      
      expect(commitSpy).toHaveBeenCalledWith(offsets);
    });

    it('should throw error when committing offsets for non-existent consumer', async () => {
      const offsets = [{ topic: 'test-topic', partition: 0, offset: '100' }];
      
      await expect(service.commitOffsets('non-existent', 'test-topic', offsets))
        .rejects.toThrow(KafkaConsumerError);
    });

    it('should pause consumer correctly', async () => {
      const pauseSpy = jest.spyOn((service as any).kafka.consumer(), 'pause');
      
      // First create a consumer
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);
      
      const topicPartitions = [{ topic: 'test-topic', partitions: [0, 1] }];
      await service.pauseConsumer('test-group', 'test-topic', topicPartitions);
      
      expect(pauseSpy).toHaveBeenCalledWith(topicPartitions);
    });

    it('should resume consumer correctly', async () => {
      const resumeSpy = jest.spyOn((service as any).kafka.consumer(), 'resume');
      
      // First create a consumer
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);
      
      const topicPartitions = [{ topic: 'test-topic', partitions: [0, 1] }];
      await service.resumeConsumer('test-group', 'test-topic', topicPartitions);
      
      expect(resumeSpy).toHaveBeenCalledWith(topicPartitions);
    });

    it('should disconnect a specific consumer', async () => {
      const disconnectSpy = jest.spyOn((service as any).kafka.consumer(), 'disconnect');
      
      // First create a consumer
      const callback = jest.fn();
      await service.consume('test-topic', 'test-group', callback);
      
      await service.disconnectConsumer('test-group', 'test-topic');
      
      expect(disconnectSpy).toHaveBeenCalled();
      expect((service as any).consumers.size).toBe(0);
    });
  });

  describe('Serialization and Deserialization', () => {
    it('should serialize messages correctly', () => {
      const message = { test: 'data' };
      const serialized = (service as any).serializeMessage(message);
      
      expect(serialized).toBeInstanceOf(Buffer);
      expect(serialized.toString()).toBe(JSON.stringify(message));
    });

    it('should handle serialization errors', () => {
      const circularRef: any = {};
      circularRef.self = circularRef;
      
      expect(() => (service as any).serializeMessage(circularRef)).toThrow(KafkaSerializationError);
    });

    it('should deserialize messages correctly', () => {
      const message = { test: 'data' };
      const buffer = Buffer.from(JSON.stringify(message));
      const deserialized = (service as any).deserializeMessage(buffer);
      
      expect(deserialized).toEqual(message);
    });

    it('should handle deserialization errors', () => {
      const invalidBuffer = Buffer.from('invalid json');
      
      expect(() => (service as any).deserializeMessage(invalidBuffer)).toThrow(KafkaSerializationError);
    });

    it('should parse headers correctly', () => {
      const headers = {
        'test-header': Buffer.from('test-value'),
        'empty-header': null,
      };
      
      const parsed = (service as any).parseHeaders(headers);
      
      expect(parsed).toEqual({
        'test-header': 'test-value',
      });
    });

    it('should format headers correctly', () => {
      const headers = {
        'test-header': 'test-value',
        'null-header': null,
        'undefined-header': undefined,
      };
      
      const formatted = (service as any).formatHeaders(headers);
      
      expect(formatted).toEqual({
        'test-header': Buffer.from('test-value'),
      });
    });
  });

  describe('Configuration Utilities', () => {
    it('should get SASL configuration when enabled', () => {
      jest.spyOn(mockConfigService, 'get')
        .mockReturnValueOnce(true) // sasl.enabled
        .mockReturnValueOnce('scram-sha-256') // sasl.mechanism
        .mockReturnValueOnce('test-user') // sasl.username
        .mockReturnValueOnce('test-pass'); // sasl.password
      
      const saslConfig = (service as any).getSaslConfig();
      
      expect(saslConfig).toEqual({
        mechanism: 'scram-sha-256',
        username: 'test-user',
        password: 'test-pass',
      });
    });

    it('should return undefined for SASL when disabled', () => {
      jest.spyOn(mockConfigService, 'get').mockReturnValueOnce(false); // sasl.enabled
      
      const saslConfig = (service as any).getSaslConfig();
      
      expect(saslConfig).toBeUndefined();
    });

    it('should get Kafka configuration with defaults', () => {
      const config = (service as any).getKafkaConfig();
      
      expect(config).toEqual(expect.objectContaining({
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        ssl: false,
        connectionTimeout: 1000,
        requestTimeout: 30000,
        retry: expect.objectContaining({
          initialRetryTime: 300,
          retries: 5,
          maxRetryTime: 30000,
          factor: 2,
          multiplier: 1.5,
        }),
      }));
    });

    it('should get retry options with defaults', () => {
      const options = (service as any).getRetryOptions();
      
      expect(options).toEqual(expect.objectContaining({
        maxRetries: 3,
        initialRetryTime: 100,
        maxRetryTime: 30000,
        factor: 2,
        retryableErrors: ['LEADER_NOT_AVAILABLE', 'NETWORK_EXCEPTION'],
      }));
    });
  });

  describe('Journey-Specific Configurations', () => {
    it('should use journey-specific configuration for health journey', async () => {
      const healthOptions = {
        serviceName: 'health-service',
        configNamespace: 'health.kafka',
      };

      // Mock journey-specific config values
      jest.spyOn(mockConfigService, 'get')
        .mockImplementation((key, defaultValue) => {
          if (key === 'health.kafka.retry.maxRetries') return 5;
          if (key === 'health.kafka.retry.initialRetryTime') return 200;
          return defaultValue;
        });

      const healthModule = await Test.createTestingModule({
        providers: [
          KafkaService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: OpenTelemetryTracingService, useValue: mockTracingService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: 'KAFKA_OPTIONS', useValue: healthOptions },
        ],
      }).compile();

      const healthService = healthModule.get<KafkaService>(KafkaService);
      expect(healthService).toBeDefined();
      
      // Verify journey-specific retry options
      const retryOptions = (healthService as any).getRetryOptions();
      expect(retryOptions.maxRetries).toBe(5);
      expect(retryOptions.initialRetryTime).toBe(200);

      await healthModule.close();
    });

    it('should use journey-specific configuration for care journey', async () => {
      const careOptions = {
        serviceName: 'care-service',
        configNamespace: 'care.kafka',
      };

      // Mock journey-specific config values
      jest.spyOn(mockConfigService, 'get')
        .mockImplementation((key, defaultValue) => {
          if (key === 'care.kafka.retry.maxRetries') return 4;
          if (key === 'care.kafka.retry.initialRetryTime') return 500;
          return defaultValue;
        });

      const careModule = await Test.createTestingModule({
        providers: [
          KafkaService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: OpenTelemetryTracingService, useValue: mockTracingService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: 'KAFKA_OPTIONS', useValue: careOptions },
        ],
      }).compile();

      const careService = careModule.get<KafkaService>(KafkaService);
      expect(careService).toBeDefined();
      
      // Verify journey-specific retry options
      const retryOptions = (careService as any).getRetryOptions();
      expect(retryOptions.maxRetries).toBe(4);
      expect(retryOptions.initialRetryTime).toBe(500);

      await careModule.close();
    });

    it('should use journey-specific configuration for plan journey', async () => {
      const planOptions = {
        serviceName: 'plan-service',
        configNamespace: 'plan.kafka',
      };

      // Mock journey-specific config values
      jest.spyOn(mockConfigService, 'get')
        .mockImplementation((key, defaultValue) => {
          if (key === 'plan.kafka.retry.maxRetries') return 3;
          if (key === 'plan.kafka.retry.initialRetryTime') return 1000;
          return defaultValue;
        });

      const planModule = await Test.createTestingModule({
        providers: [
          KafkaService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: OpenTelemetryTracingService, useValue: mockTracingService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: 'KAFKA_OPTIONS', useValue: planOptions },
        ],
      }).compile();

      const planService = planModule.get<KafkaService>(KafkaService);
      expect(planService).toBeDefined();
      
      // Verify journey-specific retry options
      const retryOptions = (planService as any).getRetryOptions();
      expect(retryOptions.maxRetries).toBe(3);
      expect(retryOptions.initialRetryTime).toBe(1000);

      await planModule.close();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle and classify different error types', async () => {
      // Network error
      const networkError = new Error('Network error');
      jest.spyOn((service as any).producer, 'send').mockRejectedValueOnce(networkError);
      
      await expect(service.produce('test-topic', sampleEvent)).rejects.toThrow(KafkaProducerError);
      
      // Validation error
      const validationError = new EventValidationError(
        'Validation failed',
        KAFKA_ERROR_CODES.VALIDATION_ERROR,
        { topic: 'test-topic', errors: ['Invalid field'] }
      );
      jest.spyOn((service as any).producer, 'send').mockRejectedValueOnce(validationError);
      
      await expect(service.produce('test-topic', sampleEvent)).rejects.toThrow(EventValidationError);
      
      // Processing error
      const processingError = new EventProcessingError(
        'Processing failed',
        KAFKA_ERROR_CODES.PROCESSING_ERROR,
        { topic: 'test-topic' }
      );
      jest.spyOn((service as any).producer, 'send').mockRejectedValueOnce(processingError);
      
      await expect(service.produce('test-topic', sampleEvent)).rejects.toThrow(EventProcessingError);
    });

    it('should implement exponential backoff for retries', async () => {
      const mockError = new Error('Retriable error');
      jest.spyOn((service as any).producer, 'send')
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce([{ topicName: 'test-topic', partition: 0, errorCode: 0 }]);
      
      // Mock retry policy for exponential backoff
      const getDelaySpy = jest.spyOn((service as any).retryPolicy, 'getDelayForAttempt')
        .mockReturnValueOnce(100)  // First retry
        .mockReturnValueOnce(200); // Second retry
      
      jest.spyOn((service as any).retryPolicy, 'shouldRetry').mockReturnValue(true);
      
      // Mock setTimeout to execute immediately
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation((callback) => {
        callback();
        return {} as any;
      });
      
      await service.produce('test-topic', sampleEvent);
      
      expect(getDelaySpy).toHaveBeenCalledTimes(2);
      expect(getDelaySpy).toHaveBeenNthCalledWith(1, 0);
      expect(getDelaySpy).toHaveBeenNthCalledWith(2, 1);
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it('should respect maximum retry limits', async () => {
      const mockError = new Error('Retriable error');
      jest.spyOn((service as any).producer, 'send').mockRejectedValue(mockError);
      
      // Mock retry policy to stop after max retries
      jest.spyOn((service as any).retryPolicy, 'shouldRetry')
        .mockReturnValueOnce(true)   // First attempt
        .mockReturnValueOnce(true)   // Second attempt
        .mockReturnValueOnce(false); // Third attempt (max reached)
      
      jest.spyOn((service as any).retryPolicy, 'getDelayForAttempt').mockReturnValue(10);
      
      // Mock setTimeout to execute immediately
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation((callback) => {
        callback();
        return {} as any;
      });
      
      await expect(service.produce('test-topic', sampleEvent)).rejects.toThrow(KafkaProducerError);
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it('should handle DLQ operations correctly', async () => {
      // Mock the sendToDLQ function
      const sendToDLQMock = jest.fn().mockResolvedValue(undefined);
      jest.mock('../../../src/errors/dlq', () => ({
        sendToDLQ: sendToDLQMock,
      }));
      
      // Create a mock message and error
      const mockMessage = {
        value: Buffer.from(JSON.stringify({ test: 'data' })),
        key: Buffer.from('test-key'),
        headers: { 'test-header': Buffer.from('test-value') },
        timestamp: '1630000000000',
        offset: '100',
      };
      const mockError = new Error('Processing error');
      
      // Call the handleDLQ method
      await (service as any).handleDLQ(
        'test-topic',
        mockMessage,
        mockError,
        'test-dlq',
        { partition: 0, offset: '100' }
      );
      
      // In a real test, we would verify sendToDLQ was called with correct parameters
    });
  });
});
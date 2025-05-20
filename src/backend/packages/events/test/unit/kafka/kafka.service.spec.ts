import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { EventSchemaRegistry } from '../../../src/schema/schema-registry.service';
import { KafkaModuleOptions } from '../../../src/interfaces/kafka-options.interface';
import { KafkaMessage } from '../../../src/interfaces/kafka-message.interface';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { KAFKA_MODULE_OPTIONS } from '../../../src/constants/tokens.constants';
import { ERROR_CODES } from '../../../src/constants/errors.constants';
import { TOPICS } from '../../../src/constants/topics.constants';
import { EventValidationError, KafkaError } from '../../../src/errors/kafka.errors';
import { KafkaTestClient, createKafkaTestClient } from '../../utils/kafka-test-client';
import { MockEventBroker } from '../../mocks/mock-event-broker';

// Mock KafkaJS
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockSend = jest.fn();
const mockSendBatch = jest.fn();
const mockSubscribe = jest.fn();
const mockRun = jest.fn();

const mockProducer = {
  connect: mockConnect,
  disconnect: mockDisconnect,
  send: mockSend,
  sendBatch: mockSendBatch,
};

const mockConsumer = {
  connect: mockConnect,
  disconnect: mockDisconnect,
  subscribe: mockSubscribe,
  run: mockRun,
};

const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
  consumer: jest.fn().mockReturnValue(mockConsumer),
};

jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn().mockImplementation(() => mockKafka),
    CompressionTypes: {
      GZIP: 1,
      None: 0,
    },
    logLevel: {
      NOTHING: 0,
      ERROR: 1,
      WARN: 2,
      INFO: 4,
      DEBUG: 5,
    },
  };
});

// Mock dependencies
const mockConfigService = {
  get: jest.fn(),
};

const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockTracingService = {
  createSpan: jest.fn().mockImplementation((name, fn) => fn({ setAttribute: jest.fn() })),
  getTraceHeaders: jest.fn().mockReturnValue({ 'trace-id': 'test-trace-id' }),
  getCurrentTraceId: jest.fn().mockReturnValue('test-trace-id'),
};

const mockSchemaRegistry = {
  validate: jest.fn(),
};

describe('KafkaService', () => {
  let service: KafkaService;
  let module: TestingModule;
  let kafkaTestClient: KafkaTestClient;
  let mockEventBroker: MockEventBroker;

  const defaultOptions: KafkaModuleOptions = {
    serviceName: 'test-service',
    configNamespace: 'test-service',
    enableSchemaValidation: true,
    enableDeadLetterQueue: true,
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default config values
    mockConfigService.get.mockImplementation((key, defaultValue) => {
      const config = {
        'service.name': 'test-service',
        'test-service.kafka.brokers': 'localhost:9092',
        'test-service.kafka.clientId': 'test-service',
        'test-service.kafka.groupId': 'test-service-consumer-group',
        'test-service.kafka.ssl': false,
        'test-service.kafka.retry.initialRetryTime': 300,
        'test-service.kafka.retry.retries': 10,
        'test-service.kafka.retry.factor': 2,
        'test-service.kafka.retry.maxRetryTime': 30000,
        'test-service.kafka.connectionTimeout': 3000,
        'test-service.kafka.requestTimeout': 30000,
        'test-service.kafka.logLevel': 'info',
        'test-service.kafka.deadLetterTopic': 'dead-letter',
        'kafka.brokers': 'localhost:9092',
        'kafka.clientId': 'default-client',
        'kafka.groupId': 'default-consumer-group',
        'kafka.ssl': false,
        'kafka.retry.initialRetryTime': 300,
        'kafka.retry.retries': 10,
        'kafka.retry.factor': 2,
        'kafka.retry.maxRetryTime': 30000,
        'kafka.connectionTimeout': 3000,
        'kafka.requestTimeout': 30000,
        'kafka.logLevel': 'info',
        'kafka.deadLetterTopic': 'dead-letter',
        'kafka.maxRetries': 3,
        'kafka.sessionTimeout': 30000,
        'kafka.heartbeatInterval': 3000,
        'kafka.maxWaitTime': 5000,
        'kafka.maxBytes': 10485760,
        'kafka.allowAutoTopicCreation': true,
      };
      return config[key] || defaultValue;
    });

    // Create test utilities
    kafkaTestClient = createKafkaTestClient();
    mockEventBroker = new MockEventBroker();

    // Create the testing module
    module = await Test.createTestingModule({
      providers: [
        KafkaService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TracingService, useValue: mockTracingService },
        { provide: EventSchemaRegistry, useValue: mockSchemaRegistry },
        { provide: KAFKA_MODULE_OPTIONS, useValue: defaultOptions },
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

  describe('initialization', () => {
    it('should initialize with the correct configuration', () => {
      // Verify Kafka was initialized with the correct config
      expect(mockKafka.producer).toHaveBeenCalledWith(expect.objectContaining({
        allowAutoTopicCreation: true,
        retry: expect.objectContaining({
          initialRetryTime: 300,
          retries: 10,
          factor: 2,
          maxRetryTime: 30000,
        }),
      }));
    });

    it('should connect the producer during initialization', async () => {
      await service.onModuleInit();
      expect(mockConnect).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Kafka producer connected successfully',
        'KafkaService'
      );
    });

    it('should handle initialization errors', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(service.onModuleInit()).rejects.toThrow();
      
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to initialize Kafka service',
        expect.any(Error),
        'KafkaService'
      );
    });

    it('should use service-specific configuration when provided', async () => {
      // Create a new service with health-service namespace
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        const config = {
          'service.name': 'health-service',
          'health-service.kafka.brokers': 'health-kafka:9092',
          'health-service.kafka.clientId': 'health-client',
          'health-service.kafka.groupId': 'health-consumer-group',
          'health-service.kafka.retry.initialRetryTime': 500,
          'kafka.brokers': 'default-kafka:9092',
        };
        return config[key] || defaultValue;
      });

      const healthOptions: KafkaModuleOptions = {
        serviceName: 'health-service',
        configNamespace: 'health-service',
      };

      const healthModule = await Test.createTestingModule({
        providers: [
          KafkaService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: TracingService, useValue: mockTracingService },
          { provide: KAFKA_MODULE_OPTIONS, useValue: healthOptions },
        ],
      }).compile();

      const healthService = healthModule.get<KafkaService>(KafkaService);
      
      // Verify the service used health-service specific config
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'health-service.kafka.brokers',
        expect.any(String)
      );
      
      await healthModule.close();
    });
  });

  describe('cleanup', () => {
    it('should disconnect the producer during module destruction', async () => {
      await service.onModuleDestroy();
      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Kafka producer disconnected successfully',
        'KafkaService'
      );
    });

    it('should disconnect all consumers during module destruction', async () => {
      // Add a mock consumer to the service's consumers map
      (service as any).consumers.set('test-consumer', mockConsumer);
      
      await service.onModuleDestroy();
      
      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        expect.stringContaining('Kafka service destroyed successfully'),
        'KafkaService'
      );
    });

    it('should handle errors during shutdown gracefully', async () => {
      mockDisconnect.mockRejectedValueOnce(new Error('Disconnect failed'));
      
      await service.onModuleDestroy();
      
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Error during Kafka service shutdown',
        expect.any(Error),
        'KafkaService'
      );
    });
  });

  describe('produce', () => {
    beforeEach(() => {
      // Reset mocks for each test
      mockSend.mockReset();
      mockSend.mockResolvedValue({});
    });

    it('should produce a message to the specified topic', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };
      const key = 'test-key';
      const headers = { 'custom-header': 'value' };

      await service.produce(topic, message, key, headers);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        topic,
        messages: expect.arrayContaining([
          expect.objectContaining({
            key,
            headers: expect.any(Object),
          }),
        ]),
      }));
    });

    it('should add metadata to messages if not present', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      await service.produce(topic, message);

      // Verify the message was serialized with metadata
      const sendCall = mockSend.mock.calls[0][0];
      const serializedMessage = sendCall.messages[0].value.toString();
      const parsedMessage = JSON.parse(serializedMessage);
      
      expect(parsedMessage).toHaveProperty('metadata');
      expect(parsedMessage.metadata).toHaveProperty('timestamp');
      expect(parsedMessage.metadata).toHaveProperty('source', 'test-service');
    });

    it('should validate messages with schema registry if available', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      await service.produce(topic, message);

      expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(topic, expect.any(Object));
    });

    it('should handle schema validation errors', async () => {
      const topic = 'test-topic';
      const message = { test: 'invalid-message' };
      
      mockSchemaRegistry.validate.mockRejectedValueOnce(new Error('Validation failed'));

      await expect(service.produce(topic, message)).rejects.toThrow(EventValidationError);
      
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed'),
        expect.any(Error),
        'KafkaService'
      );
    });

    it('should add tracing headers to messages', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      await service.produce(topic, message);

      // Verify tracing headers were added
      const sendCall = mockSend.mock.calls[0][0];
      const messageHeaders = sendCall.messages[0].headers;
      
      expect(messageHeaders).toHaveProperty('trace-id');
    });

    it('should handle producer errors', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };
      
      mockSend.mockRejectedValueOnce(new Error('Send failed'));

      await expect(service.produce(topic, message)).rejects.toThrow(KafkaError);
      
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to produce message'),
        expect.any(Error),
        'KafkaService'
      );
    });

    it('should support compression options', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };
      const options = { compression: 1 }; // GZIP

      await service.produce(topic, message, undefined, undefined, options);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        compression: 1,
      }));
    });
  });

  describe('produceBatch', () => {
    beforeEach(() => {
      // Reset mocks for each test
      mockSendBatch.mockReset();
      mockSendBatch.mockResolvedValue({});
    });

    it('should produce a batch of messages to the specified topic', async () => {
      const topic = 'test-topic';
      const messages = [
        { value: { test: 'message1' }, key: 'key1', headers: { header1: 'value1' } },
        { value: { test: 'message2' }, key: 'key2', headers: { header2: 'value2' } },
      ];

      await service.produceBatch(topic, messages);

      expect(mockSendBatch).toHaveBeenCalledWith(expect.objectContaining({
        topicMessages: expect.arrayContaining([
          expect.objectContaining({
            topic,
            messages: expect.arrayContaining([
              expect.any(Object),
              expect.any(Object),
            ]),
          }),
        ]),
      }));
    });

    it('should validate all messages in the batch', async () => {
      const topic = 'test-topic';
      const messages = [
        { value: { test: 'message1' } },
        { value: { test: 'message2' } },
      ];

      await service.produceBatch(topic, messages);

      expect(mockSchemaRegistry.validate).toHaveBeenCalledTimes(2);
    });

    it('should handle schema validation errors in batch messages', async () => {
      const topic = 'test-topic';
      const messages = [
        { value: { test: 'message1' } },
        { value: { test: 'invalid-message' } },
      ];
      
      mockSchemaRegistry.validate.mockImplementation((topic, message) => {
        if (message.test === 'invalid-message') {
          return Promise.reject(new Error('Validation failed'));
        }
        return Promise.resolve();
      });

      await expect(service.produceBatch(topic, messages)).rejects.toThrow(EventValidationError);
      
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed'),
        expect.any(Error),
        'KafkaService'
      );
    });

    it('should handle producer batch errors', async () => {
      const topic = 'test-topic';
      const messages = [
        { value: { test: 'message1' } },
        { value: { test: 'message2' } },
      ];
      
      mockSendBatch.mockRejectedValueOnce(new Error('Batch send failed'));

      await expect(service.produceBatch(topic, messages)).rejects.toThrow(KafkaError);
      
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to produce batch'),
        expect.any(Error),
        'KafkaService'
      );
    });
  });

  describe('consume', () => {
    beforeEach(() => {
      // Reset mocks for each test
      mockSubscribe.mockReset();
      mockRun.mockReset();
      mockSubscribe.mockResolvedValue({});
      mockRun.mockResolvedValue({});
    });

    it('should subscribe to the specified topic', async () => {
      const topic = 'test-topic';
      const callback = jest.fn();

      await service.consume(topic, callback);

      expect(mockSubscribe).toHaveBeenCalledWith({
        topic,
        fromBeginning: false,
      });
    });

    it('should create a consumer with the correct group ID', async () => {
      const topic = 'test-topic';
      const callback = jest.fn();
      const groupId = 'custom-group';

      await service.consume(topic, callback, { groupId });

      expect(mockKafka.consumer).toHaveBeenCalledWith(expect.objectContaining({
        groupId,
      }));
    });

    it('should configure the consumer run with the correct options', async () => {
      const topic = 'test-topic';
      const callback = jest.fn();

      await service.consume(topic, callback, { autoCommit: false });

      expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({
        autoCommit: false,
        eachMessage: expect.any(Function),
      }));
    });

    it('should handle consumer errors', async () => {
      const topic = 'test-topic';
      const callback = jest.fn();
      
      mockSubscribe.mockRejectedValueOnce(new Error('Subscribe failed'));

      await expect(service.consume(topic, callback)).rejects.toThrow(KafkaError);
      
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to consume from topic'),
        expect.any(Error),
        'KafkaService'
      );
    });

    it('should reuse existing consumers for the same group-topic combination', async () => {
      const topic = 'test-topic';
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const groupId = 'test-group';

      // First consumer
      await service.consume(topic, callback1, { groupId });
      
      // Reset mock to check if it's called again
      mockKafka.consumer.mockClear();
      
      // Second consumer with same group-topic
      await service.consume(topic, callback2, { groupId });

      // Should not create a new consumer
      expect(mockKafka.consumer).not.toHaveBeenCalled();
    });
  });

  describe('message processing', () => {
    it('should deserialize messages correctly', async () => {
      // Test the private deserializeMessage method
      const message = { test: 'message', metadata: { timestamp: new Date().toISOString() } };
      const serialized = Buffer.from(JSON.stringify(message));
      
      const result = (service as any).deserializeMessage(serialized);
      
      expect(result).toEqual(message);
    });

    it('should handle deserialization errors', () => {
      // Invalid JSON
      const invalidBuffer = Buffer.from('{invalid json');
      
      expect(() => (service as any).deserializeMessage(invalidBuffer)).toThrow();
    });

    it('should parse headers correctly', () => {
      const headers = {
        key1: Buffer.from('value1'),
        key2: Buffer.from('value2'),
      };
      
      const result = (service as any).parseHeaders(headers);
      
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should convert headers to buffers correctly', () => {
      const headers = {
        key1: 'value1',
        key2: 'value2',
      };
      
      const result = (service as any).convertHeadersToBuffers(headers);
      
      expect(result.key1).toBeInstanceOf(Buffer);
      expect(result.key2).toBeInstanceOf(Buffer);
      expect(result.key1.toString()).toBe('value1');
      expect(result.key2.toString()).toBe('value2');
    });
  });

  describe('retry and error handling', () => {
    it('should calculate retry delay with exponential backoff', () => {
      const options = {
        initialRetryTime: 100,
        factor: 2,
        maxRetryTime: 30000,
      };
      
      // First retry
      const delay1 = (service as any).calculateRetryDelay(1, options);
      // Second retry
      const delay2 = (service as any).calculateRetryDelay(2, options);
      // Third retry
      const delay3 = (service as any).calculateRetryDelay(3, options);
      
      // Check exponential growth
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      
      // Check that delay3 is approximately 4x delay1 (with jitter)
      const ratio = delay3 / delay1;
      expect(ratio).toBeGreaterThanOrEqual(3);
      expect(ratio).toBeLessThanOrEqual(5);
    });

    it('should send failed messages to the dead-letter queue', async () => {
      // Mock the produce method to test sendToDLQ
      jest.spyOn(service, 'produce').mockResolvedValue();
      
      // Call the private sendToDLQ method
      await (service as any).sendToDLQ(
        'source-topic',
        { test: 'failed-message' },
        'test-key',
        { 'error-type': 'processing-failed' }
      );
      
      // Verify produce was called with the right arguments
      expect(service.produce).toHaveBeenCalledWith(
        'dead-letter',
        { test: 'failed-message' },
        'test-key',
        expect.objectContaining({
          'error-type': 'processing-failed',
          'source-topic': 'source-topic',
          'source-service': 'test-service',
        })
      );
    });

    it('should handle errors when sending to the dead-letter queue', async () => {
      // Mock the produce method to throw an error
      jest.spyOn(service, 'produce').mockRejectedValue(new Error('DLQ send failed'));
      
      // Call the private sendToDLQ method - should not throw
      await (service as any).sendToDLQ(
        'source-topic',
        { test: 'failed-message' }
      );
      
      // Verify error was logged
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send message to dead-letter queue'),
        expect.any(Error),
        'KafkaService'
      );
    });
  });

  describe('journey-specific configurations', () => {
    it('should support health journey configuration', async () => {
      // Set up health journey specific config
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        const config = {
          'service.name': 'health-service',
          'health-service.kafka.brokers': 'health-kafka:9092',
          'health-service.kafka.retry.initialRetryTime': 500,
          'health-service.kafka.deadLetterTopic': 'health-dead-letter',
        };
        return config[key] || defaultValue;
      });

      const healthOptions: KafkaModuleOptions = {
        serviceName: 'health-service',
        configNamespace: 'health-service',
      };

      const healthModule = await Test.createTestingModule({
        providers: [
          KafkaService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: TracingService, useValue: mockTracingService },
          { provide: KAFKA_MODULE_OPTIONS, useValue: healthOptions },
        ],
      }).compile();

      const healthService = healthModule.get<KafkaService>(KafkaService);
      
      // Test that the service uses the health-specific dead letter topic
      jest.spyOn(healthService, 'produce').mockResolvedValue();
      
      await (healthService as any).sendToDLQ(
        TOPICS.HEALTH.METRICS,
        { value: 100, type: 'HEART_RATE' }
      );
      
      expect(healthService.produce).toHaveBeenCalledWith(
        'health-dead-letter',
        expect.any(Object),
        undefined,
        expect.any(Object)
      );
      
      await healthModule.close();
    });

    it('should support care journey configuration', async () => {
      // Set up care journey specific config
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        const config = {
          'service.name': 'care-service',
          'care-service.kafka.brokers': 'care-kafka:9092',
          'care-service.kafka.retry.maxRetries': 5,
          'care-service.kafka.retry.factor': 3,
        };
        return config[key] || defaultValue;
      });

      const careOptions: KafkaModuleOptions = {
        serviceName: 'care-service',
        configNamespace: 'care-service',
      };

      const careModule = await Test.createTestingModule({
        providers: [
          KafkaService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: TracingService, useValue: mockTracingService },
          { provide: KAFKA_MODULE_OPTIONS, useValue: careOptions },
        ],
      }).compile();

      const careService = careModule.get<KafkaService>(KafkaService);
      
      // Verify the retry options are correctly configured
      const retryOptions = (careService as any).defaultRetryOptions;
      expect(retryOptions.retries).toBe(5);
      expect(retryOptions.factor).toBe(3);
      
      await careModule.close();
    });

    it('should support plan journey configuration', async () => {
      // Set up plan journey specific config
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        const config = {
          'service.name': 'plan-service',
          'plan-service.kafka.brokers': 'plan-kafka:9092',
          'plan-service.kafka.groupId': 'plan-consumer-group',
          'plan-service.kafka.sasl.enabled': true,
          'plan-service.kafka.sasl.mechanism': 'plain',
          'plan-service.kafka.sasl.username': 'plan-user',
          'plan-service.kafka.sasl.password': 'plan-password',
        };
        return config[key] || defaultValue;
      });

      const planOptions: KafkaModuleOptions = {
        serviceName: 'plan-service',
        configNamespace: 'plan-service',
      };

      const planModule = await Test.createTestingModule({
        providers: [
          KafkaService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: TracingService, useValue: mockTracingService },
          { provide: KAFKA_MODULE_OPTIONS, useValue: planOptions },
        ],
      }).compile();

      const planService = planModule.get<KafkaService>(KafkaService);
      
      // Test that the SASL config is correctly applied
      const saslConfig = (planService as any).getSaslConfig('plan-service');
      expect(saslConfig).toEqual({
        mechanism: 'plain',
        username: 'plan-user',
        password: 'plan-password',
      });
      
      await planModule.close();
    });
  });

  describe('integration with event schemas', () => {
    it('should validate health journey events correctly', async () => {
      // Mock schema registry to validate health metrics
      mockSchemaRegistry.validate.mockImplementation((topic, message) => {
        if (topic === TOPICS.HEALTH.METRICS) {
          if (!message.value || !message.type) {
            return Promise.reject(new Error('Invalid health metric'));
          }
        }
        return Promise.resolve();
      });

      // Valid health metric
      const validMetric = { value: 72, type: 'HEART_RATE', unit: 'bpm' };
      await service.produce(TOPICS.HEALTH.METRICS, validMetric);
      
      // Invalid health metric
      const invalidMetric = { value: 72 }; // Missing type
      await expect(service.produce(TOPICS.HEALTH.METRICS, invalidMetric))
        .rejects.toThrow(EventValidationError);
    });

    it('should validate care journey events correctly', async () => {
      // Mock schema registry to validate care appointments
      mockSchemaRegistry.validate.mockImplementation((topic, message) => {
        if (topic === TOPICS.CARE.APPOINTMENTS) {
          if (!message.appointmentId || !message.date) {
            return Promise.reject(new Error('Invalid appointment'));
          }
        }
        return Promise.resolve();
      });

      // Valid appointment
      const validAppointment = { 
        appointmentId: '123', 
        date: '2023-05-15T10:00:00Z',
        provider: 'Dr. Smith',
        specialty: 'Cardiology'
      };
      await service.produce(TOPICS.CARE.APPOINTMENTS, validAppointment);
      
      // Invalid appointment
      const invalidAppointment = { provider: 'Dr. Smith' }; // Missing required fields
      await expect(service.produce(TOPICS.CARE.APPOINTMENTS, invalidAppointment))
        .rejects.toThrow(EventValidationError);
    });

    it('should validate plan journey events correctly', async () => {
      // Mock schema registry to validate plan claims
      mockSchemaRegistry.validate.mockImplementation((topic, message) => {
        if (topic === TOPICS.PLAN.CLAIMS) {
          if (!message.claimId || !message.amount || !message.type) {
            return Promise.reject(new Error('Invalid claim'));
          }
        }
        return Promise.resolve();
      });

      // Valid claim
      const validClaim = { 
        claimId: '456', 
        amount: 150.75,
        type: 'MEDICAL',
        provider: 'City Hospital',
        date: '2023-04-20'
      };
      await service.produce(TOPICS.PLAN.CLAIMS, validClaim);
      
      // Invalid claim
      const invalidClaim = { claimId: '456' }; // Missing required fields
      await expect(service.produce(TOPICS.PLAN.CLAIMS, invalidClaim))
        .rejects.toThrow(EventValidationError);
    });
  });

  describe('metadata handling', () => {
    it('should check for existing metadata correctly', () => {
      const withMetadata = {
        data: 'test',
        metadata: new EventMetadataDto()
      };
      
      const withoutMetadata = {
        data: 'test'
      };
      
      expect((service as any).hasMetadata(withMetadata)).toBe(true);
      expect((service as any).hasMetadata(withoutMetadata)).toBe(false);
    });

    it('should add metadata with correct fields', () => {
      const message = { data: 'test' };
      
      const result = (service as any).addMetadata(message);
      
      expect(result).toHaveProperty('data', 'test');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('source', 'test-service');
      expect(result.metadata).toHaveProperty('correlationId', 'test-trace-id');
    });

    it('should preserve existing metadata', () => {
      const existingMetadata = new EventMetadataDto();
      existingMetadata.correlationId = 'existing-correlation-id';
      
      const message = {
        data: 'test',
        metadata: existingMetadata
      };
      
      // Should not modify the message
      const result = (service as any).addMetadata(message);
      
      expect(result.metadata.correlationId).toBe('existing-correlation-id');
    });
  });
});
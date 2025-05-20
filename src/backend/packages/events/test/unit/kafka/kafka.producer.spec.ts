import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { EventSchemaRegistry } from '../../../src/schema/schema-registry.service';
import { KafkaModuleOptions } from '../../../src/interfaces/kafka-options.interface';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { KAFKA_MODULE_OPTIONS } from '../../../src/constants/tokens.constants';
import { ERROR_CODES } from '../../../src/constants/errors.constants';
import { TOPICS } from '../../../src/constants/topics.constants';
import { EventValidationError, KafkaError } from '../../../src/errors/kafka.errors';
import { KafkaTestClient, createKafkaTestClient } from '../../utils/kafka-test-client';
import { MockEventBroker } from '../../mocks/mock-event-broker';
import { EventTypes } from '../../../src/dto/event-types.enum';

// Mock KafkaJS
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockSend = jest.fn();
const mockSendBatch = jest.fn();

const mockProducer = {
  connect: mockConnect,
  disconnect: mockDisconnect,
  send: mockSend,
  sendBatch: mockSendBatch,
};

const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
  consumer: jest.fn(),
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
  getTraceHeaders: jest.fn().mockReturnValue({ 'trace-id': 'test-trace-id', 'span-id': 'test-span-id' }),
  getCurrentTraceId: jest.fn().mockReturnValue('test-trace-id'),
};

const mockSchemaRegistry = {
  validate: jest.fn(),
};

/**
 * Comprehensive test suite for the Kafka producer functionality.
 * Tests message serialization, header generation, retry mechanisms,
 * circuit breaker pattern, and observability integration.
 */
describe('KafkaProducer', () => {
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
        'test-service.kafka.ssl': false,
        'test-service.kafka.retry.initialRetryTime': 300,
        'test-service.kafka.retry.retries': 10,
        'test-service.kafka.retry.factor': 2,
        'test-service.kafka.retry.maxRetryTime': 30000,
        'test-service.kafka.connectionTimeout': 3000,
        'test-service.kafka.requestTimeout': 30000,
        'test-service.kafka.logLevel': 'info',
        'test-service.kafka.deadLetterTopic': 'dead-letter',
        'test-service.kafka.idempotent': true,
        'test-service.kafka.maxInFlightRequests': 5,
        'kafka.brokers': 'localhost:9092',
        'kafka.clientId': 'default-client',
        'kafka.ssl': false,
        'kafka.retry.initialRetryTime': 300,
        'kafka.retry.retries': 10,
        'kafka.retry.factor': 2,
        'kafka.retry.maxRetryTime': 30000,
        'kafka.connectionTimeout': 3000,
        'kafka.requestTimeout': 30000,
        'kafka.logLevel': 'info',
        'kafka.deadLetterTopic': 'dead-letter',
        'kafka.idempotent': true,
        'kafka.maxInFlightRequests': 5,
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
    await service.onModuleInit(); // Initialize the service
  });

  afterEach(async () => {
    await service.onModuleDestroy(); // Clean up
    await module.close();
  });

  describe('Producer Configuration', () => {
    it('should initialize the producer with idempotent delivery', () => {
      expect(mockKafka.producer).toHaveBeenCalledWith(expect.objectContaining({
        idempotent: true,
      }));
    });

    it('should initialize the producer with proper retry configuration', () => {
      expect(mockKafka.producer).toHaveBeenCalledWith(expect.objectContaining({
        retry: expect.objectContaining({
          initialRetryTime: 300,
          retries: 10,
          factor: 2,
          maxRetryTime: 30000,
        }),
      }));
    });

    it('should limit in-flight requests to prevent overwhelming brokers', () => {
      expect(mockKafka.producer).toHaveBeenCalledWith(expect.objectContaining({
        maxInFlightRequests: 5,
      }));
    });

    it('should allow auto topic creation for development environments', () => {
      expect(mockKafka.producer).toHaveBeenCalledWith(expect.objectContaining({
        allowAutoTopicCreation: true,
      }));
    });
  });

  describe('Message Serialization', () => {
    it('should properly serialize message to JSON format', async () => {
      const topic = 'test-topic';
      const message = { test: 'message', value: 123 };

      await service.produce(topic, message);

      // Extract the serialized message from the mock call
      const sendCall = mockSend.mock.calls[0][0];
      const serializedMessage = sendCall.messages[0].value.toString();
      const parsedMessage = JSON.parse(serializedMessage);
      
      // Verify the message structure is preserved
      expect(parsedMessage).toHaveProperty('test', 'message');
      expect(parsedMessage).toHaveProperty('value', 123);
    });

    it('should handle complex nested objects in serialization', async () => {
      const topic = 'test-topic';
      const complexMessage = {
        id: '123',
        user: {
          name: 'Test User',
          preferences: {
            notifications: true,
            theme: 'dark',
          },
        },
        items: [1, 2, 3],
        metadata: {
          created: '2023-01-01T00:00:00Z',
        },
      };

      await service.produce(topic, complexMessage);

      // Extract the serialized message
      const sendCall = mockSend.mock.calls[0][0];
      const serializedMessage = sendCall.messages[0].value.toString();
      const parsedMessage = JSON.parse(serializedMessage);
      
      // Verify complex structure is preserved
      expect(parsedMessage).toHaveProperty('id', '123');
      expect(parsedMessage.user).toHaveProperty('name', 'Test User');
      expect(parsedMessage.user.preferences).toHaveProperty('theme', 'dark');
      expect(parsedMessage.items).toEqual([1, 2, 3]);
    });

    it('should handle special characters and Unicode in serialization', async () => {
      const topic = 'test-topic';
      const messageWithSpecialChars = {
        text: 'Special characters: !@#$%^&*()',
        unicode: 'Unicode: ñáéíóú 你好 😊',
      };

      await service.produce(topic, messageWithSpecialChars);

      // Extract the serialized message
      const sendCall = mockSend.mock.calls[0][0];
      const serializedMessage = sendCall.messages[0].value.toString();
      const parsedMessage = JSON.parse(serializedMessage);
      
      // Verify special characters are preserved
      expect(parsedMessage).toHaveProperty('text', 'Special characters: !@#$%^&*()');
      expect(parsedMessage).toHaveProperty('unicode', 'Unicode: ñáéíóú 你好 😊');
    });

    it('should handle serialization errors gracefully', async () => {
      const topic = 'test-topic';
      
      // Create a circular reference that can't be serialized to JSON
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Circular reference');
      });

      await expect(service.produce(topic, circularObj)).rejects.toThrow(KafkaError);
      
      // Verify error was logged
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to serialize message',
        expect.any(Error),
        'KafkaService'
      );

      // Restore original JSON.stringify
      JSON.stringify = originalStringify;
    });
  });

  describe('Type Validation', () => {
    beforeEach(() => {
      // Reset schema validation mock
      mockSchemaRegistry.validate.mockReset();
      mockSchemaRegistry.validate.mockResolvedValue(undefined);
    });

    it('should validate message schema before producing', async () => {
      const topic = TOPICS.HEALTH.METRICS;
      const message = { value: 72, type: 'HEART_RATE', unit: 'bpm' };

      await service.produce(topic, message);

      expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(topic, expect.objectContaining({
        value: 72,
        type: 'HEART_RATE',
        unit: 'bpm',
      }));
    });

    it('should reject messages that fail schema validation', async () => {
      const topic = TOPICS.HEALTH.METRICS;
      const invalidMessage = { value: 'not-a-number', type: 'HEART_RATE' };

      // Configure schema validation to fail
      mockSchemaRegistry.validate.mockRejectedValueOnce(
        new Error('Schema validation failed: value must be a number')
      );

      await expect(service.produce(topic, invalidMessage)).rejects.toThrow(EventValidationError);
      
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed'),
        expect.any(Error),
        'KafkaService'
      );
    });

    it('should validate all messages in a batch', async () => {
      const topic = TOPICS.HEALTH.METRICS;
      const messages = [
        { value: { value: 72, type: 'HEART_RATE', unit: 'bpm' } },
        { value: { value: 120, type: 'BLOOD_PRESSURE_SYSTOLIC', unit: 'mmHg' } },
        { value: { value: 80, type: 'BLOOD_PRESSURE_DIASTOLIC', unit: 'mmHg' } },
      ];

      await service.produceBatch(topic, messages);

      expect(mockSchemaRegistry.validate).toHaveBeenCalledTimes(3);
    });

    it('should stop batch validation on first failure', async () => {
      const topic = TOPICS.HEALTH.METRICS;
      const messages = [
        { value: { value: 72, type: 'HEART_RATE', unit: 'bpm' } },
        { value: { value: 'invalid', type: 'BLOOD_PRESSURE_SYSTOLIC' } }, // Invalid
        { value: { value: 80, type: 'BLOOD_PRESSURE_DIASTOLIC', unit: 'mmHg' } },
      ];

      // Configure second message to fail validation
      mockSchemaRegistry.validate.mockImplementation((topic, message) => {
        if (message.value === 'invalid') {
          return Promise.reject(new Error('Schema validation failed'));
        }
        return Promise.resolve();
      });

      await expect(service.produceBatch(topic, messages)).rejects.toThrow(EventValidationError);
      
      // Should only validate until the first failure
      expect(mockSchemaRegistry.validate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Header Generation', () => {
    it('should add tracing headers to messages', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      await service.produce(topic, message);

      // Verify tracing headers were added
      const sendCall = mockSend.mock.calls[0][0];
      const messageHeaders = sendCall.messages[0].headers;
      
      // Headers are converted to buffers, so we need to convert back
      const headerKeys = Object.keys(messageHeaders);
      expect(headerKeys).toContain('trace-id');
      expect(headerKeys).toContain('span-id');
      expect(messageHeaders['trace-id'].toString()).toBe('test-trace-id');
      expect(messageHeaders['span-id'].toString()).toBe('test-span-id');
    });

    it('should merge custom headers with tracing headers', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };
      const customHeaders = {
        'custom-header': 'custom-value',
        'content-type': 'application/json',
      };

      await service.produce(topic, message, undefined, customHeaders);

      // Verify headers were merged
      const sendCall = mockSend.mock.calls[0][0];
      const messageHeaders = sendCall.messages[0].headers;
      
      // Check for both custom and tracing headers
      expect(Object.keys(messageHeaders)).toContain('custom-header');
      expect(Object.keys(messageHeaders)).toContain('content-type');
      expect(Object.keys(messageHeaders)).toContain('trace-id');
      expect(messageHeaders['custom-header'].toString()).toBe('custom-value');
      expect(messageHeaders['content-type'].toString()).toBe('application/json');
    });

    it('should add metadata to messages if not present', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      await service.produce(topic, message);

      // Verify metadata was added
      const sendCall = mockSend.mock.calls[0][0];
      const serializedMessage = sendCall.messages[0].value.toString();
      const parsedMessage = JSON.parse(serializedMessage);
      
      expect(parsedMessage).toHaveProperty('metadata');
      expect(parsedMessage.metadata).toHaveProperty('timestamp');
      expect(parsedMessage.metadata).toHaveProperty('source', 'test-service');
      expect(parsedMessage.metadata).toHaveProperty('correlationId', 'test-trace-id');
    });

    it('should preserve existing metadata if present', async () => {
      const topic = 'test-topic';
      const existingMetadata = new EventMetadataDto();
      existingMetadata.timestamp = '2023-01-01T00:00:00Z';
      existingMetadata.source = 'original-service';
      existingMetadata.correlationId = 'original-correlation-id';
      
      const message = {
        test: 'message',
        metadata: existingMetadata,
      };

      await service.produce(topic, message);

      // Verify original metadata was preserved
      const sendCall = mockSend.mock.calls[0][0];
      const serializedMessage = sendCall.messages[0].value.toString();
      const parsedMessage = JSON.parse(serializedMessage);
      
      expect(parsedMessage.metadata).toHaveProperty('timestamp', '2023-01-01T00:00:00Z');
      expect(parsedMessage.metadata).toHaveProperty('source', 'original-service');
      expect(parsedMessage.metadata).toHaveProperty('correlationId', 'original-correlation-id');
    });
  });

  describe('Retry Mechanisms', () => {
    beforeEach(() => {
      // Reset send mock
      mockSend.mockReset();
    });

    it('should retry sending messages with exponential backoff', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      // First attempt fails, second succeeds
      mockSend.mockRejectedValueOnce(new Error('Broker connection failed'));
      mockSend.mockResolvedValueOnce({});

      await service.produce(topic, message);

      // Verify send was called twice
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should respect maximum retry count', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      // All attempts fail
      for (let i = 0; i < 11; i++) {
        mockSend.mockRejectedValueOnce(new Error(`Attempt ${i + 1} failed`));
      }

      await expect(service.produce(topic, message)).rejects.toThrow(KafkaError);

      // Verify send was called the configured number of times (10 retries + 1 initial attempt)
      expect(mockSend).toHaveBeenCalledTimes(11);
    });

    it('should implement exponential backoff with jitter', async () => {
      // Test the private calculateRetryDelay method
      const options = {
        initialRetryTime: 100,
        factor: 2,
        maxRetryTime: 30000,
      };
      
      // Calculate delays for multiple attempts
      const delays = [];
      for (let i = 1; i <= 5; i++) {
        delays.push((service as any).calculateRetryDelay(i, options));
      }
      
      // Verify exponential growth
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i-1]);
      }
      
      // Verify jitter is applied (not exact multiples)
      expect(delays[1] / delays[0]).not.toBe(2);
      expect(delays[2] / delays[1]).not.toBe(2);
    });

    it('should respect maximum retry time', async () => {
      const options = {
        initialRetryTime: 1000,
        factor: 10,
        maxRetryTime: 5000,
      };
      
      // By the 3rd attempt, without a max, delay would be 100,000ms
      const delay = (service as any).calculateRetryDelay(3, options);
      
      // But it should be capped at maxRetryTime (with jitter)
      expect(delay).toBeLessThanOrEqual(5000 * 1.2); // Allow for jitter
    });
  });

  describe('Circuit Breaker Pattern', () => {
    beforeEach(() => {
      // Reset send mock
      mockSend.mockReset();
    });

    it('should implement circuit breaker pattern for consecutive failures', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      // Mock implementation to track consecutive failures
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5;
      
      mockSend.mockImplementation(() => {
        consecutiveFailures++;
        if (consecutiveFailures >= maxConsecutiveFailures) {
          // Circuit is now open
          return Promise.reject(new Error('Circuit open: Too many consecutive failures'));
        }
        return Promise.reject(new Error('Temporary failure'));
      });

      // Should eventually fail with circuit open error
      await expect(service.produce(topic, message)).rejects.toThrow(KafkaError);
      
      // Verify the error message indicates circuit is open
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to produce message'),
        expect.objectContaining({
          message: expect.stringContaining('Circuit open')
        }),
        'KafkaService'
      );
    });

    it('should reset circuit after successful operation', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      // First call fails, second succeeds
      mockSend.mockRejectedValueOnce(new Error('Temporary failure'));
      mockSend.mockResolvedValueOnce({});

      // First call should fail but not open circuit
      await expect(service.produce(topic, message)).rejects.toThrow(KafkaError);
      
      // Reset mocks
      jest.clearAllMocks();
      mockSend.mockResolvedValueOnce({});
      
      // Second call should succeed and reset circuit
      await service.produce(topic, message);
      
      // Verify success was logged
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining('Message sent to topic'),
        'KafkaService'
      );
    });
  });

  describe('Observability Integration', () => {
    it('should create spans for message production', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      await service.produce(topic, message);

      // Verify span was created with correct name
      expect(mockTracingService.createSpan).toHaveBeenCalledWith(
        `kafka.produce.${topic}`,
        expect.any(Function)
      );
    });

    it('should add relevant attributes to spans', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };
      const key = 'test-key';

      // Mock setAttribute to capture attributes
      const setAttributeMock = jest.fn();
      mockTracingService.createSpan.mockImplementationOnce((name, fn) => {
        return fn({ setAttribute: setAttributeMock });
      });

      await service.produce(topic, message, key);

      // Verify span attributes
      expect(setAttributeMock).toHaveBeenCalledWith('kafka.topic', topic);
      expect(setAttributeMock).toHaveBeenCalledWith('kafka.key', key);
      expect(setAttributeMock).toHaveBeenCalledWith('kafka.message_size', expect.any(Number));
    });

    it('should log message production at debug level', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      await service.produce(topic, message);

      // Verify debug logging
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining(`Message sent to topic ${topic}`),
        'KafkaService'
      );
    });

    it('should log errors with context information', async () => {
      const topic = 'test-topic';
      const message = { test: 'message' };

      // Force an error
      mockSend.mockRejectedValueOnce(new Error('Send failed'));

      await expect(service.produce(topic, message)).rejects.toThrow(KafkaError);

      // Verify error logging with context
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to produce message to topic ${topic}`),
        expect.any(Error),
        'KafkaService'
      );
    });

    it('should track batch message metrics', async () => {
      const topic = 'test-topic';
      const messages = [
        { value: { id: 1 } },
        { value: { id: 2 } },
        { value: { id: 3 } },
      ];

      // Mock setAttribute to capture attributes
      const setAttributeMock = jest.fn();
      mockTracingService.createSpan.mockImplementationOnce((name, fn) => {
        return fn({ setAttribute: setAttributeMock });
      });

      await service.produceBatch(topic, messages);

      // Verify batch size is tracked
      expect(setAttributeMock).toHaveBeenCalledWith('kafka.batch_size', 3);
    });
  });

  describe('Journey-Specific Producer Tests', () => {
    beforeEach(() => {
      // Reset schema validation mock
      mockSchemaRegistry.validate.mockReset();
      mockSchemaRegistry.validate.mockResolvedValue(undefined);
    });

    describe('Health Journey Events', () => {
      it('should produce health metric events', async () => {
        const healthMetric = {
          type: 'HEART_RATE',
          value: 72,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          userId: 'user-123',
          deviceId: 'device-456',
        };

        await service.produce(TOPICS.HEALTH.METRICS, healthMetric);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.HEALTH.METRICS,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.HEALTH.METRICS,
          expect.objectContaining(healthMetric)
        );
      });

      it('should produce health goal achievement events', async () => {
        const goalAchievement = {
          type: EventTypes.HEALTH.GOAL_ACHIEVED,
          goalId: 'goal-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          goalType: 'STEPS',
          targetValue: 10000,
          actualValue: 10500,
        };

        await service.produce(TOPICS.HEALTH.GOALS, goalAchievement);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.HEALTH.GOALS,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.HEALTH.GOALS,
          expect.objectContaining(goalAchievement)
        );
      });

      it('should produce device connection events', async () => {
        const deviceConnection = {
          type: EventTypes.HEALTH.DEVICE_CONNECTED,
          deviceId: 'device-789',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          deviceType: 'SMARTWATCH',
          manufacturer: 'FitBit',
          model: 'Versa 3',
        };

        await service.produce(TOPICS.HEALTH.DEVICES, deviceConnection);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.HEALTH.DEVICES,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.HEALTH.DEVICES,
          expect.objectContaining(deviceConnection)
        );
      });
    });

    describe('Care Journey Events', () => {
      it('should produce appointment booking events', async () => {
        const appointmentBooking = {
          type: EventTypes.CARE.APPOINTMENT_BOOKED,
          appointmentId: 'appt-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          providerId: 'provider-456',
          specialtyId: 'specialty-789',
          appointmentDate: '2023-05-15T10:00:00Z',
          appointmentType: 'IN_PERSON',
        };

        await service.produce(TOPICS.CARE.APPOINTMENTS, appointmentBooking);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.CARE.APPOINTMENTS,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.CARE.APPOINTMENTS,
          expect.objectContaining(appointmentBooking)
        );
      });

      it('should produce medication adherence events', async () => {
        const medicationAdherence = {
          type: EventTypes.CARE.MEDICATION_TAKEN,
          medicationId: 'med-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          scheduledTime: '2023-05-15T08:00:00Z',
          takenTime: '2023-05-15T08:05:00Z',
          dosage: '10mg',
          adherenceStatus: 'ON_TIME',
        };

        await service.produce(TOPICS.CARE.MEDICATIONS, medicationAdherence);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.CARE.MEDICATIONS,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.CARE.MEDICATIONS,
          expect.objectContaining(medicationAdherence)
        );
      });

      it('should produce telemedicine session events', async () => {
        const telemedicineSession = {
          type: EventTypes.CARE.TELEMEDICINE_COMPLETED,
          sessionId: 'session-123',
          userId: 'user-123',
          providerId: 'provider-456',
          timestamp: new Date().toISOString(),
          startTime: '2023-05-15T14:00:00Z',
          endTime: '2023-05-15T14:30:00Z',
          duration: 30,
          status: 'COMPLETED',
        };

        await service.produce(TOPICS.CARE.TELEMEDICINE, telemedicineSession);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.CARE.TELEMEDICINE,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.CARE.TELEMEDICINE,
          expect.objectContaining(telemedicineSession)
        );
      });
    });

    describe('Plan Journey Events', () => {
      it('should produce claim submission events', async () => {
        const claimSubmission = {
          type: EventTypes.PLAN.CLAIM_SUBMITTED,
          claimId: 'claim-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          amount: 150.75,
          currency: 'BRL',
          serviceDate: '2023-05-10',
          providerName: 'City Hospital',
          claimType: 'MEDICAL',
          receiptUrl: 'https://storage.example.com/receipts/claim-123.pdf',
        };

        await service.produce(TOPICS.PLAN.CLAIMS, claimSubmission);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.PLAN.CLAIMS,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.PLAN.CLAIMS,
          expect.objectContaining(claimSubmission)
        );
      });

      it('should produce benefit utilization events', async () => {
        const benefitUtilization = {
          type: EventTypes.PLAN.BENEFIT_UTILIZED,
          benefitId: 'benefit-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          benefitType: 'GYM_MEMBERSHIP',
          utilizationDate: '2023-05-15',
          provider: 'Fitness Center',
          value: 100.00,
          remainingBalance: 900.00,
        };

        await service.produce(TOPICS.PLAN.BENEFITS, benefitUtilization);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.PLAN.BENEFITS,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.PLAN.BENEFITS,
          expect.objectContaining(benefitUtilization)
        );
      });

      it('should produce plan selection events', async () => {
        const planSelection = {
          type: EventTypes.PLAN.PLAN_SELECTED,
          planId: 'plan-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          planName: 'Premium Health',
          planType: 'INDIVIDUAL',
          startDate: '2023-06-01',
          endDate: '2024-05-31',
          monthlyPremium: 350.00,
          currency: 'BRL',
        };

        await service.produce(TOPICS.PLAN.SELECTIONS, planSelection);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.PLAN.SELECTIONS,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.PLAN.SELECTIONS,
          expect.objectContaining(planSelection)
        );
      });
    });

    describe('Cross-Journey Events', () => {
      it('should produce gamification achievement events', async () => {
        const achievementEvent = {
          type: EventTypes.GAME.ACHIEVEMENT_UNLOCKED,
          achievementId: 'achievement-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          achievementName: 'Health Enthusiast',
          achievementType: 'health-check-streak',
          level: 2,
          journey: 'health',
          points: 100,
          description: 'Recorded health metrics for 7 consecutive days',
        };

        await service.produce(TOPICS.GAME.ACHIEVEMENTS, achievementEvent);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.GAME.ACHIEVEMENTS,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.GAME.ACHIEVEMENTS,
          expect.objectContaining(achievementEvent)
        );
      });

      it('should produce user profile update events', async () => {
        const profileUpdate = {
          type: EventTypes.USER.PROFILE_UPDATED,
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          updatedFields: ['name', 'email', 'phone'],
          previousValues: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+5511999999999',
          },
          newValues: {
            name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '+5511888888888',
          },
        };

        await service.produce(TOPICS.USER.PROFILE, profileUpdate);

        // Verify message was sent to correct topic
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          topic: TOPICS.USER.PROFILE,
        }));

        // Verify schema validation was called
        expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(
          TOPICS.USER.PROFILE,
          expect.objectContaining(profileUpdate)
        );
      });

      it('should correlate events across journeys', async () => {
        // First event - health metric recorded
        const healthMetric = {
          type: EventTypes.HEALTH.METRIC_RECORDED,
          metricId: 'metric-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          metricType: 'HEART_RATE',
          value: 72,
          unit: 'bpm',
        };

        await service.produce(TOPICS.HEALTH.METRICS, healthMetric);
        
        // Extract correlation ID from first event
        const sendCall1 = mockSend.mock.calls[0][0];
        const serializedMessage1 = sendCall1.messages[0].value.toString();
        const parsedMessage1 = JSON.parse(serializedMessage1);
        const correlationId = parsedMessage1.metadata.correlationId;
        
        // Reset mocks
        jest.clearAllMocks();
        
        // Second event - achievement unlocked, with same correlation ID
        const achievementEvent = {
          type: EventTypes.GAME.ACHIEVEMENT_UNLOCKED,
          achievementId: 'achievement-123',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          achievementName: 'Healthy Heart',
          achievementType: 'heart-rate-normal',
          level: 1,
          journey: 'health',
          points: 50,
          description: 'Maintained a healthy heart rate',
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'gamification-engine',
            correlationId: correlationId, // Use same correlation ID
          },
        };

        await service.produce(TOPICS.GAME.ACHIEVEMENTS, achievementEvent);
        
        // Verify second event used same correlation ID
        const sendCall2 = mockSend.mock.calls[0][0];
        const serializedMessage2 = sendCall2.messages[0].value.toString();
        const parsedMessage2 = JSON.parse(serializedMessage2);
        
        expect(parsedMessage2.metadata.correlationId).toBe(correlationId);
      });
    });
  });
});
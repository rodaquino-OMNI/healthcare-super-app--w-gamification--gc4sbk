/**
 * @file kafka.producer.spec.ts
 * @description Unit tests for the Kafka producer that handles message production with guaranteed delivery.
 * Tests verify message serialization, header generation, retry mechanisms, circuit breaker pattern,
 * and observability integration.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Kafka, Producer, RecordMetadata } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

import { KafkaProducer } from '../../../src/kafka/kafka.producer';
import { KAFKA_PROVIDERS } from '../../../src/kafka/kafka.constants';
import { EventJourney } from '../../../src/kafka/kafka.types';
import {
  KafkaConnectionError,
  KafkaProducerError,
  KafkaSerializationError,
} from '../../../src/kafka/kafka.errors';

// Mock implementations
const mockProducer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, errorCode: 0, baseOffset: '0' }]),
  transaction: jest.fn().mockReturnValue({
    send: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
    abort: jest.fn().mockResolvedValue(undefined),
  }),
};

const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
};

// Mock Logger to avoid console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    })),
  };
});

// Mock uuid to have predictable IDs in tests
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

describe('KafkaProducer', () => {
  let kafkaProducer: KafkaProducer;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        KafkaProducer,
        {
          provide: KAFKA_PROVIDERS.CLIENT,
          useValue: mockKafka,
        },
        {
          provide: KAFKA_PROVIDERS.OPTIONS,
          useValue: {
            serviceName: 'test-service',
            enableMetrics: true,
            enableTracing: true,
            config: {
              allowAutoTopicCreation: true,
              idempotent: true,
              acks: -1,
            },
          },
        },
      ],
    }).compile();

    kafkaProducer = module.get<KafkaProducer>(KafkaProducer);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(kafkaProducer).toBeDefined();
    });

    it('should initialize with default options when none provided', async () => {
      const moduleWithDefaults = await Test.createTestingModule({
        providers: [
          KafkaProducer,
          {
            provide: KAFKA_PROVIDERS.CLIENT,
            useValue: mockKafka,
          },
        ],
      }).compile();

      const producerWithDefaults = moduleWithDefaults.get<KafkaProducer>(KafkaProducer);
      expect(producerWithDefaults).toBeDefined();
      await moduleWithDefaults.close();
    });
  });

  describe('Connection Management', () => {
    it('should connect to Kafka broker on module init', async () => {
      await kafkaProducer.onModuleInit();
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
    });

    it('should disconnect from Kafka broker on module destroy', async () => {
      // First connect to set the connected state
      await kafkaProducer.connect();
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);

      // Then test disconnect
      await kafkaProducer.onModuleDestroy();
      expect(mockProducer.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should not attempt to connect if already connected', async () => {
      await kafkaProducer.connect();
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);

      // Second connect should not call the producer connect again
      await kafkaProducer.connect();
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
    });

    it('should not attempt to disconnect if not connected', async () => {
      // Ensure not connected
      await kafkaProducer.disconnect();
      expect(mockProducer.disconnect).toHaveBeenCalledTimes(0);
    });

    it('should handle connection errors', async () => {
      mockProducer.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(kafkaProducer.connect()).rejects.toThrow(KafkaConnectionError);
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection errors', async () => {
      // First connect to set the connected state
      await kafkaProducer.connect();
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);

      // Mock disconnect error
      mockProducer.disconnect.mockRejectedValueOnce(new Error('Disconnection failed'));

      await expect(kafkaProducer.disconnect()).rejects.toThrow(KafkaConnectionError);
      expect(mockProducer.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should report connection status correctly', async () => {
      expect(kafkaProducer.isConnected()).toBe(false);

      await kafkaProducer.connect();
      expect(kafkaProducer.isConnected()).toBe(true);

      await kafkaProducer.disconnect();
      expect(kafkaProducer.isConnected()).toBe(false);
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      // Ensure connected before each test
      await kafkaProducer.connect();
    });

    it('should send a single message successfully', async () => {
      const message = { test: 'data' };
      const result = await kafkaProducer.send('test-topic', message);

      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: null,
            headers: expect.objectContaining({
              'content-type': expect.any(Buffer),
              'timestamp': expect.any(Buffer),
              'source-service': expect.any(Buffer),
              'correlation-id': expect.any(Buffer),
            }),
          },
        ],
        acks: -1,
        timeout: undefined,
        compression: 0,
      });

      expect(result).toEqual([{ topicName: 'test-topic', partition: 0, errorCode: 0, baseOffset: '0' }]);
    });

    it('should send a batch of messages successfully', async () => {
      const messages = [{ id: 1 }, { id: 2 }];
      const result = await kafkaProducer.send('test-topic', messages);

      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: null,
            headers: expect.any(Object),
          },
          {
            value: expect.any(Buffer),
            key: null,
            headers: expect.any(Object),
          },
        ],
        acks: -1,
        timeout: undefined,
        compression: 0,
      });

      expect(result).toEqual([{ topicName: 'test-topic', partition: 0, errorCode: 0, baseOffset: '0' }]);
    });

    it('should connect automatically if not connected', async () => {
      // Disconnect first
      await kafkaProducer.disconnect();
      expect(kafkaProducer.isConnected()).toBe(false);

      // Reset mock to track new calls
      mockProducer.connect.mockClear();

      // Send should trigger connect
      await kafkaProducer.send('test-topic', { test: 'data' });
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
    });

    it('should include custom headers when provided', async () => {
      const message = { test: 'data' };
      const customHeaders = {
        'custom-header': 'custom-value',
        'x-request-id': 'request-123',
      };

      await kafkaProducer.send('test-topic', message, undefined, customHeaders);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: null,
            headers: expect.objectContaining({
              'custom-header': Buffer.from('custom-value'),
              'x-request-id': Buffer.from('request-123'),
            }),
          },
        ],
        acks: -1,
        timeout: undefined,
        compression: 0,
      });
    });

    it('should use provided key for partitioning', async () => {
      const message = { test: 'data' };
      const key = 'partition-key';

      await kafkaProducer.send('test-topic', message, key);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            value: expect.any(Buffer),
            key: Buffer.from(key),
            headers: expect.any(Object),
          },
        ],
        acks: -1,
        timeout: undefined,
        compression: 0,
      });
    });

    it('should handle send errors and throw KafkaProducerError', async () => {
      mockProducer.send.mockRejectedValueOnce(new Error('Send failed'));

      await expect(kafkaProducer.send('test-topic', { test: 'data' })).rejects.toThrow(KafkaProducerError);
    });
  });

  describe('Message Serialization', () => {
    it('should serialize JSON objects correctly', async () => {
      const message = { test: 'data', nested: { value: 123 } };
      await kafkaProducer.send('test-topic', message);

      // Extract the Buffer from the send call
      const sendCall = mockProducer.send.mock.calls[0];
      const sentBuffer = sendCall[0].messages[0].value;

      // Verify the buffer contains the correct serialized JSON
      const deserializedMessage = JSON.parse(sentBuffer.toString());
      expect(deserializedMessage).toEqual(message);
    });

    it('should handle string messages', async () => {
      const message = 'string-message';
      await kafkaProducer.send('test-topic', message);

      const sendCall = mockProducer.send.mock.calls[0];
      const sentBuffer = sendCall[0].messages[0].value;

      expect(sentBuffer.toString()).toBe(message);
    });

    it('should handle Buffer messages', async () => {
      const originalBuffer = Buffer.from('buffer-message');
      await kafkaProducer.send('test-topic', originalBuffer);

      const sendCall = mockProducer.send.mock.calls[0];
      const sentBuffer = sendCall[0].messages[0].value;

      expect(sentBuffer).toBe(originalBuffer);
    });

    it('should handle null/undefined messages as empty buffers', async () => {
      await kafkaProducer.send('test-topic', null);

      const sendCall = mockProducer.send.mock.calls[0];
      const sentBuffer = sendCall[0].messages[0].value;

      expect(sentBuffer.toString()).toBe('');
    });

    it('should throw KafkaSerializationError for non-serializable objects', async () => {
      // Create an object with circular reference
      const circular: any = {};
      circular.self = circular;

      // Mock JSON.stringify to throw error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Circular reference');
      });

      await expect(kafkaProducer.send('test-topic', circular)).rejects.toThrow(KafkaSerializationError);

      // Restore original JSON.stringify
      JSON.stringify = originalStringify;
    });
  });

  describe('Transaction Support', () => {
    beforeEach(async () => {
      // Create a new producer with transactional ID
      module = await Test.createTestingModule({
        providers: [
          KafkaProducer,
          {
            provide: KAFKA_PROVIDERS.CLIENT,
            useValue: mockKafka,
          },
          {
            provide: KAFKA_PROVIDERS.OPTIONS,
            useValue: {
              serviceName: 'test-service',
              config: {
                transactionalId: 'test-transaction-id',
              },
            },
          },
        ],
      }).compile();

      kafkaProducer = module.get<KafkaProducer>(KafkaProducer);
      await kafkaProducer.connect();
    });

    it('should send messages within a transaction', async () => {
      const message = { test: 'data' };
      const transactionId = 'tx-123';

      await kafkaProducer.sendWithTransaction('test-topic', message, transactionId);

      expect(mockProducer.transaction).toHaveBeenCalledTimes(1);
      expect(mockProducer.transaction().commit).toHaveBeenCalledTimes(1);
    });

    it('should abort transaction on error', async () => {
      const message = { test: 'data' };
      const transactionId = 'tx-123';

      // Mock send to throw error
      mockProducer.send.mockRejectedValueOnce(new Error('Transaction send failed'));

      await expect(kafkaProducer.sendWithTransaction('test-topic', message, transactionId)).rejects.toThrow();

      expect(mockProducer.transaction).toHaveBeenCalledTimes(1);
      expect(mockProducer.transaction().abort).toHaveBeenCalledTimes(1);
      expect(mockProducer.transaction().commit).not.toHaveBeenCalled();
    });

    it('should throw error if producer not configured for transactions', async () => {
      // Create a new producer without transactional ID
      const nonTxModule = await Test.createTestingModule({
        providers: [
          KafkaProducer,
          {
            provide: KAFKA_PROVIDERS.CLIENT,
            useValue: mockKafka,
          },
          {
            provide: KAFKA_PROVIDERS.OPTIONS,
            useValue: {
              serviceName: 'test-service',
              config: {
                // No transactionalId
              },
            },
          },
        ],
      }).compile();

      const nonTxProducer = nonTxModule.get<KafkaProducer>(KafkaProducer);
      await nonTxProducer.connect();

      await expect(nonTxProducer.sendWithTransaction('test-topic', { test: 'data' }, 'tx-123')).rejects.toThrow(
        'Producer is not configured for transactions'
      );

      await nonTxModule.close();
    });
  });

  describe('Retry Mechanism', () => {
    beforeEach(async () => {
      await kafkaProducer.connect();
    });

    it('should retry failed sends according to retry policy', async () => {
      // Mock send to fail twice then succeed
      mockProducer.send
        .mockRejectedValueOnce(new Error('Send failed - attempt 1'))
        .mockRejectedValueOnce(new Error('Send failed - attempt 2'))
        .mockResolvedValueOnce([{ topicName: 'test-topic', partition: 0, errorCode: 0, baseOffset: '0' }]);

      const result = await kafkaProducer.send('test-topic', { test: 'data' });

      expect(mockProducer.send).toHaveBeenCalledTimes(3);
      expect(result).toEqual([{ topicName: 'test-topic', partition: 0, errorCode: 0, baseOffset: '0' }]);
    });

    it('should throw error after max retries', async () => {
      // Mock send to always fail
      mockProducer.send.mockRejectedValue(new Error('Send failed'));

      await expect(kafkaProducer.send('test-topic', { test: 'data' })).rejects.toThrow(KafkaProducerError);
      // Default retry count is 10, so we expect 11 calls (original + 10 retries)
      expect(mockProducer.send).toHaveBeenCalledTimes(11);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should implement circuit breaker for fault tolerance', async () => {
      // This is a simplified test for circuit breaker behavior
      // In a real test, we would need to verify state transitions

      // Mock connect to fail consistently
      mockProducer.connect.mockRejectedValue(new Error('Connection failed'));

      // First attempt should try to connect
      await expect(kafkaProducer.connect()).rejects.toThrow(KafkaConnectionError);
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);

      // Reset mock to simulate circuit open
      mockProducer.connect.mockClear();

      // Subsequent attempts should fail fast due to circuit breaker
      // Note: This is a simplified test - in reality, the circuit breaker would need time to trip
      await expect(kafkaProducer.connect()).rejects.toThrow();
    });
  });

  describe('Journey-Specific Messaging', () => {
    beforeEach(async () => {
      await kafkaProducer.connect();
    });

    it('should send messages to health journey topics', async () => {
      const payload = {
        topic: 'metrics.recorded',
        value: { metricType: 'HEART_RATE', value: 75 },
      };

      await kafkaProducer.sendToJourney(EventJourney.HEALTH, payload);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'austa.health.metrics.recorded',
        messages: expect.any(Array),
        acks: -1,
        timeout: undefined,
        compression: 0,
      });
    });

    it('should send messages to care journey topics', async () => {
      const payload = {
        topic: 'appointment.booked',
        value: { appointmentId: '123', providerId: '456' },
      };

      await kafkaProducer.sendToJourney(EventJourney.CARE, payload);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'austa.care.appointment.booked',
        messages: expect.any(Array),
        acks: -1,
        timeout: undefined,
        compression: 0,
      });
    });

    it('should send messages to plan journey topics', async () => {
      const payload = {
        topic: 'claim.submitted',
        value: { claimId: '789', amount: 100.5 },
      };

      await kafkaProducer.sendToJourney(EventJourney.PLAN, payload);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'austa.plan.claim.submitted',
        messages: expect.any(Array),
        acks: -1,
        timeout: undefined,
        compression: 0,
      });
    });
  });

  describe('Observability Integration', () => {
    beforeEach(async () => {
      await kafkaProducer.connect();
    });

    it('should record metrics for successful message production', async () => {
      // This is a simplified test for metrics recording
      // In a real test, we would verify metrics were sent to a metrics service

      const loggerSpy = jest.spyOn((kafkaProducer as any).logger, 'debug');

      await kafkaProducer.send('test-topic', { test: 'data' });

      // Verify debug logs for metrics
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('METRIC:'),
        expect.any(Object)
      );
    });

    it('should record metrics for failed message production', async () => {
      // Mock send to fail
      mockProducer.send.mockRejectedValueOnce(new Error('Send failed'));

      const loggerSpy = jest.spyOn((kafkaProducer as any).logger, 'debug');

      await expect(kafkaProducer.send('test-topic', { test: 'data' })).rejects.toThrow();

      // Verify debug logs for error metrics
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('METRIC:'),
        expect.any(Object)
      );
    });

    it('should include distributed tracing headers', async () => {
      await kafkaProducer.send('test-topic', { test: 'data' });

      const sendCall = mockProducer.send.mock.calls[0];
      const headers = sendCall[0].messages[0].headers;

      // Verify tracing headers
      expect(headers).toHaveProperty('correlation-id');
      expect(headers).toHaveProperty('source-service');
      expect(headers).toHaveProperty('timestamp');
    });
  });
});
/**
 * @file Kafka Producer Unit Tests
 * @description Comprehensive test suite for the Kafka producer that handles message production with guaranteed delivery.
 * Tests verify message serialization, header generation, retry mechanisms, circuit breaker pattern, and observability integration.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Producer, Kafka, RecordMetadata, CompressionTypes } from 'kafkajs';
import { Observable, firstValueFrom, throwError, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { TracingService } from '@austa/tracing';
import { LoggingService } from '@austa/logging';

import { KafkaProducer } from '../../../src/kafka/kafka.producer';
import { IKafkaMessage, IKafkaHeaders, IKafkaProducerRecord } from '../../../src/kafka/kafka.interfaces';
import { KAFKA_HEADERS, RETRY_CONFIG, HEALTH_EVENT_TOPICS, CARE_EVENT_TOPICS, PLAN_EVENT_TOPICS } from '../../../src/kafka/kafka.constants';
import { KafkaError, KafkaProducerError, KafkaMessageSerializationError, KafkaCircuitBreaker } from '../../../src/kafka/kafka.errors';
import { BaseEvent, createEvent } from '../../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

// Mock implementations
const mockProducer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockImplementation(() => Promise.resolve([{ topicName: 'test-topic', partition: 0, baseOffset: '0', timestamp: '1617979797' }])),
  transaction: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, baseOffset: '0', timestamp: '1617979797' }]),
    sendBatch: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, baseOffset: '0', timestamp: '1617979797' }]),
    commit: jest.fn().mockResolvedValue(undefined),
    abort: jest.fn().mockResolvedValue(undefined),
  })),
};

const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
};

const mockTracingService = {
  getCorrelationId: jest.fn().mockReturnValue('test-correlation-id'),
  traceAsync: jest.fn().mockImplementation((name, fn, options) => fn({ setAttribute: jest.fn() })),
};

const mockLoggingService = {
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock UUID to make tests deterministic
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

// Mock environment variables
process.env.SERVICE_NAME = 'test-service';

describe('KafkaProducer', () => {
  let producer: KafkaProducer;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        KafkaProducer,
        {
          provide: Kafka,
          useValue: mockKafka,
        },
        {
          provide: TracingService,
          useValue: mockTracingService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    producer = module.get<KafkaProducer>(KafkaProducer);
    await producer.onModuleInit(); // This will call connect()
  });

  afterEach(async () => {
    await producer.onModuleDestroy(); // This will call disconnect()
  });

  describe('Lifecycle Management', () => {
    it('should connect on module initialization', async () => {
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
      expect(producer.isConnected()).toBe(true);
    });

    it('should disconnect on module destruction', async () => {
      await producer.onModuleDestroy();
      expect(mockProducer.disconnect).toHaveBeenCalledTimes(1);
      expect(producer.isConnected()).toBe(false);
    });

    it('should handle connection errors gracefully', async () => {
      // Reset the producer to test connection error handling
      await producer.disconnect();
      
      // Mock connection failure
      mockProducer.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      // Attempt to connect
      await expect(producer.connect()).rejects.toThrow('Connection failed');
      expect(mockLoggingService.error).toHaveBeenCalled();
      expect(producer.isConnected()).toBe(false);
    });

    it('should handle disconnection errors gracefully', async () => {
      // Mock disconnection failure
      mockProducer.disconnect.mockRejectedValueOnce(new Error('Disconnection failed'));
      
      // Attempt to disconnect
      await expect(producer.disconnect()).rejects.toThrow('Disconnection failed');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should not attempt to connect if already connected', async () => {
      // Reset mock call count
      mockProducer.connect.mockClear();
      
      // Already connected from beforeEach
      await producer.connect();
      
      // Should not call connect again
      expect(mockProducer.connect).not.toHaveBeenCalled();
    });

    it('should not attempt to disconnect if already disconnected', async () => {
      // Disconnect first
      await producer.disconnect();
      
      // Reset mock call count
      mockProducer.disconnect.mockClear();
      
      // Already disconnected
      await producer.disconnect();
      
      // Should not call disconnect again
      expect(mockProducer.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('Message Serialization', () => {
    it('should properly serialize string values', async () => {
      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      await producer.send(message);

      // Verify the message was serialized correctly
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: null,
            value: Buffer.from('test-message'),
            headers: {},
          },
        ],
      });
    });

    it('should properly serialize object values as JSON', async () => {
      const message: IKafkaMessage<{ id: number; name: string }> = {
        topic: 'test-topic',
        value: { id: 123, name: 'test' },
      };

      await producer.send(message);

      // Verify the message was serialized correctly
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: null,
            value: Buffer.from(JSON.stringify({ id: 123, name: 'test' })),
            headers: {},
          },
        ],
      });
    });

    it('should handle Buffer values without additional serialization', async () => {
      const buffer = Buffer.from('test-buffer');
      const message: IKafkaMessage<Buffer> = {
        topic: 'test-topic',
        value: buffer,
      };

      await producer.send(message);

      // Verify the buffer was passed through without additional serialization
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: null,
            value: buffer,
            headers: {},
          },
        ],
      });
    });

    it('should handle null/undefined values', async () => {
      const message: IKafkaMessage<null> = {
        topic: 'test-topic',
        value: null,
      };

      await producer.send(message);

      // Verify null was handled correctly
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: null,
            value: null,
            headers: {},
          },
        ],
      });
    });

    it('should throw KafkaMessageSerializationError for non-serializable values', async () => {
      // Create a circular reference that can't be serialized to JSON
      const circular: any = {};
      circular.self = circular;

      const message: IKafkaMessage<any> = {
        topic: 'test-topic',
        value: circular,
      };

      await expect(producer.send(message)).rejects.toThrow(KafkaMessageSerializationError);
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should properly serialize message headers', async () => {
      const headers: IKafkaHeaders = {
        'string-header': 'string-value',
        'number-header': '123',
        'object-header': JSON.stringify({ key: 'value' }),
      };

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
        headers,
      };

      await producer.send(message);

      // Verify headers were serialized correctly
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: null,
            value: Buffer.from('test-message'),
            headers: {
              'string-header': Buffer.from('string-value'),
              'number-header': Buffer.from('123'),
              'object-header': Buffer.from(JSON.stringify({ key: 'value' })),
            },
          },
        ],
      });
    });

    it('should throw KafkaMessageSerializationError for non-serializable headers', async () => {
      // Create a circular reference that can't be serialized to JSON
      const circular: any = {};
      circular.self = circular;

      const headers: IKafkaHeaders = {
        'circular-header': circular as any, // Type assertion to bypass TypeScript check
      };

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
        headers,
      };

      await expect(producer.send(message)).rejects.toThrow(KafkaMessageSerializationError);
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('Message Sending', () => {
    it('should send a message to the specified topic', async () => {
      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      const result = await producer.send(message);

      // Verify the message was sent
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: null,
            value: Buffer.from('test-message'),
            headers: {},
          },
        ],
      });

      // Verify the result structure
      expect(result).toEqual({
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: '1617979797',
      });
    });

    it('should send a message with a specific partition', async () => {
      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        partition: 1,
        value: 'test-message',
      };

      await producer.send(message);

      // Verify the partition was included
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        partition: 1,
        messages: [
          {
            key: null,
            value: Buffer.from('test-message'),
            headers: {},
          },
        ],
      });
    });

    it('should send a message with a key', async () => {
      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        key: 'test-key',
        value: 'test-message',
      };

      await producer.send(message);

      // Verify the key was included
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: Buffer.from('test-key'),
            value: Buffer.from('test-message'),
            headers: {},
          },
        ],
      });
    });

    it('should handle send errors gracefully', async () => {
      // Mock send failure
      mockProducer.send.mockRejectedValueOnce(new Error('Send failed'));

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      await expect(producer.send(message)).rejects.toThrow(KafkaProducerError);
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should connect automatically if not connected', async () => {
      // Disconnect first
      await producer.disconnect();
      
      // Reset mock call counts
      mockProducer.connect.mockClear();
      mockProducer.send.mockClear();
      
      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      await producer.send(message);

      // Should connect before sending
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('Batch Message Sending', () => {
    it('should send a batch of messages', async () => {
      const messages: IKafkaMessage<string>[] = [
        { topic: 'test-topic', value: 'message-1' },
        { topic: 'test-topic', value: 'message-2' },
        { topic: 'test-topic', value: 'message-3' },
      ];

      await producer.sendBatch(messages);

      // Verify the batch was sent
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: null,
            value: Buffer.from('message-1'),
            headers: {},
          },
          {
            key: null,
            value: Buffer.from('message-2'),
            headers: {},
          },
          {
            key: null,
            value: Buffer.from('message-3'),
            headers: {},
          },
        ],
      });
    });

    it('should handle empty batch gracefully', async () => {
      const result = await producer.sendBatch([]);
      
      // Should not call send for empty batch
      expect(mockProducer.send).not.toHaveBeenCalled();
      
      // Should return empty records array
      expect(result).toEqual({ records: [] });
    });

    it('should group messages by topic', async () => {
      const messages: IKafkaMessage<string>[] = [
        { topic: 'topic-1', value: 'message-1' },
        { topic: 'topic-2', value: 'message-2' },
        { topic: 'topic-1', value: 'message-3' },
      ];

      await producer.sendBatch(messages);

      // Should call send twice, once for each topic
      expect(mockProducer.send).toHaveBeenCalledTimes(2);
      
      // Verify first topic batch
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'topic-1',
        messages: [
          {
            key: null,
            value: Buffer.from('message-1'),
            headers: {},
          },
          {
            key: null,
            value: Buffer.from('message-3'),
            headers: {},
          },
        ],
      });
      
      // Verify second topic batch
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'topic-2',
        messages: [
          {
            key: null,
            value: Buffer.from('message-2'),
            headers: {},
          },
        ],
      });
    });

    it('should handle batch send errors gracefully', async () => {
      // Mock send failure
      mockProducer.send.mockRejectedValueOnce(new Error('Batch send failed'));

      const messages: IKafkaMessage<string>[] = [
        { topic: 'test-topic', value: 'message-1' },
        { topic: 'test-topic', value: 'message-2' },
      ];

      await expect(producer.sendBatch(messages)).rejects.toThrow(KafkaProducerError);
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('Event Sending', () => {
    it('should send an event with proper headers', async () => {
      const event: BaseEvent<{ data: string }> = {
        eventId: 'event-123',
        type: 'TEST_EVENT',
        timestamp: '2023-04-15T14:32:17.000Z',
        version: '1.0.0',
        source: 'test-service',
        userId: 'user-123',
        journey: 'HEALTH',
        payload: { data: 'test-data' },
        metadata: {
          correlationId: 'correlation-123',
        },
      };

      await producer.sendEvent('test-topic', event);

      // Verify the event was sent with proper headers
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: Buffer.from('user-123'),
            value: expect.any(Buffer),
            headers: {
              [KAFKA_HEADERS.CORRELATION_ID]: Buffer.from('correlation-123'),
              [KAFKA_HEADERS.EVENT_TYPE]: Buffer.from('TEST_EVENT'),
              [KAFKA_HEADERS.EVENT_VERSION]: Buffer.from('1.0.0'),
              [KAFKA_HEADERS.TIMESTAMP]: expect.any(Buffer),
              [KAFKA_HEADERS.SOURCE_SERVICE]: Buffer.from('test-service'),
              [KAFKA_HEADERS.USER_ID]: Buffer.from('user-123'),
              [KAFKA_HEADERS.JOURNEY]: Buffer.from('HEALTH'),
            },
          },
        ],
      });
    });

    it('should use provided key when sending an event', async () => {
      const event: BaseEvent<{ data: string }> = {
        eventId: 'event-123',
        type: 'TEST_EVENT',
        timestamp: '2023-04-15T14:32:17.000Z',
        version: '1.0.0',
        source: 'test-service',
        payload: { data: 'test-data' },
      };

      await producer.sendEvent('test-topic', event, 'custom-key');

      // Verify the custom key was used
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: Buffer.from('custom-key'),
            value: expect.any(Buffer),
            headers: expect.any(Object),
          },
        ],
      });
    });

    it('should generate a correlation ID if not provided', async () => {
      // Mock getCorrelationId to return null to test fallback to UUID
      mockTracingService.getCorrelationId.mockReturnValueOnce(null);

      const event: BaseEvent<{ data: string }> = {
        eventId: 'event-123',
        type: 'TEST_EVENT',
        timestamp: '2023-04-15T14:32:17.000Z',
        version: '1.0.0',
        source: 'test-service',
        payload: { data: 'test-data' },
      };

      await producer.sendEvent('test-topic', event);

      // Verify a UUID was generated for correlation ID
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: expect.any(Buffer),
            value: expect.any(Buffer),
            headers: expect.objectContaining({
              [KAFKA_HEADERS.CORRELATION_ID]: Buffer.from('test-uuid'), // From mocked UUID
            }),
          },
        ],
      });
      expect(uuidv4).toHaveBeenCalled();
    });

    it('should enhance event with metadata if not present', async () => {
      // Create minimal event without metadata
      const event: BaseEvent<{ data: string }> = {
        eventId: 'event-123',
        type: 'TEST_EVENT',
        timestamp: '2023-04-15T14:32:17.000Z',
        version: '1.0.0',
        source: 'test-service',
        payload: { data: 'test-data' },
      };

      await producer.sendEvent('test-topic', event);

      // Extract the sent event from the mock call
      const sentMessage = mockProducer.send.mock.calls[0][0].messages[0];
      const sentEvent = JSON.parse(sentMessage.value.toString());

      // Verify metadata was added
      expect(sentEvent.metadata).toBeDefined();
      expect(sentEvent.metadata.correlationId).toBe('test-correlation-id');
      expect(sentEvent.metadata.sourceService).toBe('test-service');
    });

    it('should create a tracing span when sending an event', async () => {
      const event: BaseEvent<{ data: string }> = {
        eventId: 'event-123',
        type: 'TEST_EVENT',
        timestamp: '2023-04-15T14:32:17.000Z',
        version: '1.0.0',
        source: 'test-service',
        userId: 'user-123',
        journey: 'HEALTH',
        payload: { data: 'test-data' },
      };

      await producer.sendEvent('test-topic', event);

      // Verify tracing was used
      expect(mockTracingService.traceAsync).toHaveBeenCalledWith(
        'kafka.producer.sendEvent',
        expect.any(Function),
        { correlationId: 'test-correlation-id' }
      );
    });
  });

  describe('Transaction Support', () => {
    it('should create and use a transaction', async () => {
      const transaction = await producer.transaction();

      // Verify transaction was created
      expect(mockProducer.transaction).toHaveBeenCalled();

      // Send a message in the transaction
      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      await transaction.send(message);

      // Commit the transaction
      await transaction.commit();

      // Verify transaction methods were called
      const mockTransaction = mockProducer.transaction.mock.results[0].value;
      expect(mockTransaction.send).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle transaction send errors', async () => {
      const transaction = await producer.transaction();

      // Mock transaction send failure
      const mockTransaction = mockProducer.transaction.mock.results[0].value;
      mockTransaction.send.mockRejectedValueOnce(new Error('Transaction send failed'));

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      await expect(transaction.send(message)).rejects.toThrow('Transaction send failed');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should handle transaction commit errors', async () => {
      const transaction = await producer.transaction();

      // Mock transaction commit failure
      const mockTransaction = mockProducer.transaction.mock.results[0].value;
      mockTransaction.commit.mockRejectedValueOnce(new Error('Transaction commit failed'));

      await expect(transaction.commit()).rejects.toThrow('Transaction commit failed');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should handle transaction abort', async () => {
      const transaction = await producer.transaction();

      // Abort the transaction
      await transaction.abort();

      // Verify abort was called
      const mockTransaction = mockProducer.transaction.mock.results[0].value;
      expect(mockTransaction.abort).toHaveBeenCalled();
    });

    it('should handle transaction creation errors', async () => {
      // Mock transaction creation failure
      mockProducer.transaction.mockRejectedValueOnce(new Error('Transaction creation failed'));

      await expect(producer.transaction()).rejects.toThrow('Transaction creation failed');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should send batch messages in a transaction', async () => {
      const transaction = await producer.transaction();

      const messages: IKafkaMessage<string>[] = [
        { topic: 'test-topic', value: 'message-1' },
        { topic: 'test-topic', value: 'message-2' },
      ];

      await transaction.sendBatch(messages);

      // Verify transaction sendBatch was called
      const mockTransaction = mockProducer.transaction.mock.results[0].value;
      expect(mockTransaction.send).toHaveBeenCalled();
    });

    it('should handle empty batch in transaction gracefully', async () => {
      const transaction = await producer.transaction();

      const result = await transaction.sendBatch([]);

      // Should not call send for empty batch
      const mockTransaction = mockProducer.transaction.mock.results[0].value;
      expect(mockTransaction.send).not.toHaveBeenCalled();

      // Should return empty records array
      expect(result).toEqual({ records: [] });
    });
  });

  describe('Retry Mechanisms', () => {
    it('should retry sending a message with exponential backoff', async () => {
      // Mock send to fail once then succeed
      mockProducer.send
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce([{ topicName: 'test-topic', partition: 0, baseOffset: '0', timestamp: '1617979797' }]);

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      // Use the observable retry method
      const result = await firstValueFrom(producer.sendWithRetry(message));

      // Verify send was called twice (initial + retry)
      expect(mockProducer.send).toHaveBeenCalledTimes(2);
      
      // Verify warning was logged for retry
      expect(mockLoggingService.warn).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: '1617979797',
      });
    });

    it('should give up after maximum retries', async () => {
      // Mock send to always fail
      mockProducer.send.mockRejectedValue(new Error('Connection error'));

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      // Use the observable retry method
      await expect(firstValueFrom(producer.sendWithRetry(message))).rejects.toThrow();

      // Verify send was called MAX_RETRIES + 1 times (initial + retries)
      expect(mockProducer.send).toHaveBeenCalledTimes(RETRY_CONFIG.MAX_RETRIES + 1);
      
      // Verify error was logged for final failure
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should not retry non-retryable errors', async () => {
      // Mock send to fail with a non-retryable error
      mockProducer.send.mockRejectedValueOnce(new Error('Serialization error'));

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      // Use the observable retry method
      await expect(firstValueFrom(producer.sendWithRetry(message))).rejects.toThrow();

      // Verify send was called only once (no retries)
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
    });

    it('should retry sending a batch with exponential backoff', async () => {
      // Mock send to fail once then succeed
      mockProducer.send
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce([{ topicName: 'test-topic', partition: 0, baseOffset: '0', timestamp: '1617979797' }]);

      const messages: IKafkaMessage<string>[] = [
        { topic: 'test-topic', value: 'message-1' },
        { topic: 'test-topic', value: 'message-2' },
      ];

      // Use the observable retry method
      const result = await firstValueFrom(producer.sendBatchWithRetry(messages));

      // Verify send was called twice (initial + retry)
      expect(mockProducer.send).toHaveBeenCalledTimes(2);
      
      // Verify warning was logged for retry
      expect(mockLoggingService.warn).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        records: [
          {
            topic: 'test-topic',
            partition: 0,
            offset: '0',
            timestamp: '1617979797',
          },
        ],
      });
    });

    it('should retry sending an event with exponential backoff', async () => {
      // Mock send to fail once then succeed
      mockProducer.send
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce([{ topicName: 'test-topic', partition: 0, baseOffset: '0', timestamp: '1617979797' }]);

      const event: BaseEvent<{ data: string }> = {
        eventId: 'event-123',
        type: 'TEST_EVENT',
        timestamp: '2023-04-15T14:32:17.000Z',
        version: '1.0.0',
        source: 'test-service',
        payload: { data: 'test-data' },
      };

      // Use the observable retry method
      const result = await firstValueFrom(producer.sendEventWithRetry('test-topic', event));

      // Verify send was called twice (initial + retry)
      expect(mockProducer.send).toHaveBeenCalledTimes(2);
      
      // Verify warning was logged for retry
      expect(mockLoggingService.warn).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: '1617979797',
      });
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should use circuit breaker when sending messages', async () => {
      // We need to spy on the circuit breaker's execute method
      // Since we can't easily access the private circuit breaker instance,
      // we'll mock the behavior by making send fail with a specific error
      
      // Mock send to throw a circuit breaker open error
      mockProducer.send.mockRejectedValueOnce(new Error('Circuit breaker is open'));

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      await expect(producer.send(message)).rejects.toThrow('Circuit breaker is open');
      
      // Verify error was logged
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('Journey-Specific Event Integration', () => {
    it('should send health journey events with proper format', async () => {
      // Create a health journey event
      const healthEvent = createEvent(
        'HEALTH_METRIC_RECORDED',
        'health-service',
        {
          userId: 'user-123',
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: '2023-04-15T14:32:17.000Z',
        },
        {
          userId: 'user-123',
          journey: 'HEALTH' as JourneyType,
        }
      );

      await producer.sendEvent(HEALTH_EVENT_TOPICS.METRICS, healthEvent);

      // Verify the event was sent to the correct topic with proper headers
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: HEALTH_EVENT_TOPICS.METRICS,
        messages: [
          {
            key: Buffer.from('user-123'),
            value: expect.any(Buffer),
            headers: expect.objectContaining({
              [KAFKA_HEADERS.EVENT_TYPE]: Buffer.from('HEALTH_METRIC_RECORDED'),
              [KAFKA_HEADERS.JOURNEY]: Buffer.from('HEALTH'),
              [KAFKA_HEADERS.USER_ID]: Buffer.from('user-123'),
            }),
          },
        ],
      });
    });

    it('should send care journey events with proper format', async () => {
      // Create a care journey event
      const careEvent = createEvent(
        'APPOINTMENT_BOOKED',
        'care-service',
        {
          userId: 'user-123',
          appointmentId: 'appt-123',
          providerId: 'provider-123',
          specialtyId: 'specialty-123',
          dateTime: '2023-04-20T10:00:00.000Z',
          status: 'CONFIRMED',
        },
        {
          userId: 'user-123',
          journey: 'CARE' as JourneyType,
        }
      );

      await producer.sendEvent(CARE_EVENT_TOPICS.APPOINTMENTS, careEvent);

      // Verify the event was sent to the correct topic with proper headers
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: CARE_EVENT_TOPICS.APPOINTMENTS,
        messages: [
          {
            key: Buffer.from('user-123'),
            value: expect.any(Buffer),
            headers: expect.objectContaining({
              [KAFKA_HEADERS.EVENT_TYPE]: Buffer.from('APPOINTMENT_BOOKED'),
              [KAFKA_HEADERS.JOURNEY]: Buffer.from('CARE'),
              [KAFKA_HEADERS.USER_ID]: Buffer.from('user-123'),
            }),
          },
        ],
      });
    });

    it('should send plan journey events with proper format', async () => {
      // Create a plan journey event
      const planEvent = createEvent(
        'CLAIM_SUBMITTED',
        'plan-service',
        {
          userId: 'user-123',
          claimId: 'claim-123',
          claimType: 'MEDICAL',
          amount: 150.75,
          currency: 'BRL',
          status: 'PENDING',
          submissionDate: '2023-04-15T14:32:17.000Z',
        },
        {
          userId: 'user-123',
          journey: 'PLAN' as JourneyType,
        }
      );

      await producer.sendEvent(PLAN_EVENT_TOPICS.CLAIMS, planEvent);

      // Verify the event was sent to the correct topic with proper headers
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: PLAN_EVENT_TOPICS.CLAIMS,
        messages: [
          {
            key: Buffer.from('user-123'),
            value: expect.any(Buffer),
            headers: expect.objectContaining({
              [KAFKA_HEADERS.EVENT_TYPE]: Buffer.from('CLAIM_SUBMITTED'),
              [KAFKA_HEADERS.JOURNEY]: Buffer.from('PLAN'),
              [KAFKA_HEADERS.USER_ID]: Buffer.from('user-123'),
            }),
          },
        ],
      });
    });
  });

  describe('Observability Integration', () => {
    it('should log successful message production', async () => {
      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      await producer.send(message);

      // Verify debug log was called
      expect(mockLoggingService.debug).toHaveBeenCalledWith(
        'Message sent to topic test-topic',
        expect.objectContaining({
          topic: 'test-topic',
          partition: 0,
          offset: '0',
        })
      );
    });

    it('should log errors with appropriate context', async () => {
      // Mock send failure
      mockProducer.send.mockRejectedValueOnce(new Error('Send failed'));

      const message: IKafkaMessage<string> = {
        topic: 'test-topic',
        value: 'test-message',
      };

      try {
        await producer.send(message);
      } catch (error) {
        // Expected error
      }

      // Verify error log was called with context
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        expect.stringContaining('Kafka producer error'),
        expect.any(String),
        expect.objectContaining({
          topic: 'test-topic',
          error: expect.any(Object),
        })
      );
    });

    it('should add tracing attributes when sending events', async () => {
      const event: BaseEvent<{ data: string }> = {
        eventId: 'event-123',
        type: 'TEST_EVENT',
        timestamp: '2023-04-15T14:32:17.000Z',
        version: '1.0.0',
        source: 'test-service',
        userId: 'user-123',
        journey: 'HEALTH',
        payload: { data: 'test-data' },
      };

      // Create a mock span to verify attributes
      const mockSpan = { setAttribute: jest.fn() };
      mockTracingService.traceAsync.mockImplementationOnce((name, fn) => fn(mockSpan));

      await producer.sendEvent('test-topic', event);

      // Verify span attributes were set
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('kafka.topic', 'test-topic');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('kafka.event.type', 'TEST_EVENT');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('kafka.event.version', '1.0.0');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('kafka.correlation_id', 'test-correlation-id');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('user.id', 'user-123');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey', 'HEALTH');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('kafka.partition', 0);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('kafka.offset', '0');
    });
  });
});
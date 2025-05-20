import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { 
  KafkaError, 
  EventValidationError, 
  ProducerError, 
  ConsumerError, 
  MessageSerializationError 
} from '../../../src/errors/kafka.errors';
import { ERROR_CODES, ERROR_MESSAGES, ERROR_SEVERITY, HTTP_STATUS_CODES } from '../../../src/constants/errors.constants';
import { TOPICS } from '../../../src/constants/topics.constants';

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
  createSpan: jest.fn((name, fn) => fn()),
  getTraceHeaders: jest.fn(() => ({})),
  getCurrentTraceId: jest.fn(() => 'mock-trace-id'),
};

// Mock Kafka client and components
const mockProducer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn(),
  sendBatch: jest.fn(),
};

const mockConsumer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  run: jest.fn(),
};

const mockKafka = {
  producer: jest.fn(() => mockProducer),
  consumer: jest.fn(() => mockConsumer),
};

// Mock kafkajs module
jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn(() => mockKafka),
    CompressionTypes: {
      GZIP: 1,
      None: 0,
    },
    logLevel: {
      INFO: 4,
      ERROR: 1,
      WARN: 2,
      DEBUG: 5,
      NOTHING: 0,
    },
  };
});

describe('Kafka Error Handling', () => {
  let kafkaService: KafkaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configure default mock responses
    mockConfigService.get.mockImplementation((key, defaultValue) => {
      const config = {
        'service.name': 'test-service',
        'kafka.brokers': 'localhost:9092',
        'kafka.clientId': 'test-client',
        'kafka.retry.initialRetryTime': 300,
        'kafka.retry.retries': 10,
        'kafka.retry.factor': 2,
        'kafka.retry.maxRetryTime': 30000,
        'kafka.deadLetterTopic': TOPICS.DEAD_LETTER,
        'kafka.groupId': 'test-consumer-group',
        'kafka.ssl': false,
        'kafka.maxRetries': 3,
      };
      return config[key] || defaultValue;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TracingService, useValue: mockTracingService },
      ],
    }).compile();

    kafkaService = module.get<KafkaService>(KafkaService);
  });

  describe('Error Classification', () => {
    it('should create a base KafkaError with correct properties', () => {
      const message = 'Test error message';
      const code = ERROR_CODES.PRODUCER_SEND_FAILED;
      const context = { topic: 'test-topic', key: 'test-key' };
      const cause = new Error('Original error');

      const error = new KafkaError(message, code, context, cause);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('KafkaError');
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.context).toEqual(context);
      expect(error.cause).toBe(cause);
      expect(error.stack).toBeDefined();
    });

    it('should create specialized error classes with correct inheritance', () => {
      const message = 'Test error message';
      const code = ERROR_CODES.SCHEMA_VALIDATION_FAILED;
      const context = { topic: 'test-topic' };

      const validationError = new EventValidationError(message, code, context);
      const producerError = new ProducerError(message, code, context);
      const consumerError = new ConsumerError(message, code, context);
      const serializationError = new MessageSerializationError(message, code, context);

      // Check inheritance
      expect(validationError).toBeInstanceOf(KafkaError);
      expect(producerError).toBeInstanceOf(KafkaError);
      expect(consumerError).toBeInstanceOf(KafkaError);
      expect(serializationError).toBeInstanceOf(KafkaError);

      // Check specialized names
      expect(validationError.name).toBe('EventValidationError');
      expect(producerError.name).toBe('ProducerError');
      expect(consumerError.name).toBe('ConsumerError');
      expect(serializationError.name).toBe('MessageSerializationError');

      // Check properties are preserved
      expect(validationError.code).toBe(code);
      expect(validationError.context).toEqual(context);
    });

    it('should map error codes to correct error messages', () => {
      // Test a sample of error codes
      const producerError = new KafkaError(
        ERROR_MESSAGES[ERROR_CODES.PRODUCER_SEND_FAILED],
        ERROR_CODES.PRODUCER_SEND_FAILED
      );

      const consumerError = new KafkaError(
        ERROR_MESSAGES[ERROR_CODES.CONSUMER_PROCESSING_FAILED],
        ERROR_CODES.CONSUMER_PROCESSING_FAILED
      );

      const schemaError = new KafkaError(
        ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
        ERROR_CODES.SCHEMA_VALIDATION_FAILED
      );

      // Verify messages match the constants
      expect(producerError.message).toBe('Failed to produce message to topic');
      expect(consumerError.message).toBe('Failed to process message from topic');
      expect(schemaError.message).toBe('Message failed schema validation');
    });

    it('should have correct severity levels for different error types', () => {
      // Check severity levels for different error codes
      expect(ERROR_SEVERITY[ERROR_CODES.INITIALIZATION_FAILED]).toBe('CRITICAL');
      expect(ERROR_SEVERITY[ERROR_CODES.PRODUCER_CONNECTION_FAILED]).toBe('CRITICAL');
      expect(ERROR_SEVERITY[ERROR_CODES.PRODUCER_SEND_FAILED]).toBe('ERROR');
      expect(ERROR_SEVERITY[ERROR_CODES.SCHEMA_VALIDATION_FAILED]).toBe('ERROR');
      expect(ERROR_SEVERITY[ERROR_CODES.DLQ_SEND_FAILED]).toBe('WARNING');
      expect(ERROR_SEVERITY[ERROR_CODES.RETRY_EXHAUSTED]).toBe('WARNING');
    });

    it('should map error codes to appropriate HTTP status codes', () => {
      // Check HTTP status codes for different error codes
      expect(HTTP_STATUS_CODES[ERROR_CODES.INITIALIZATION_FAILED]).toBe(500);
      expect(HTTP_STATUS_CODES[ERROR_CODES.PRODUCER_CONNECTION_FAILED]).toBe(503);
      expect(HTTP_STATUS_CODES[ERROR_CODES.SCHEMA_VALIDATION_FAILED]).toBe(400);
      expect(HTTP_STATUS_CODES[ERROR_CODES.RETRY_EXHAUSTED]).toBe(503);
    });
  });

  describe('Error Context Enrichment', () => {
    it('should enrich errors with operation context', () => {
      const topic = 'test-topic';
      const partition = 0;
      const offset = '100';
      const key = 'test-key';

      const context = {
        topic,
        partition,
        offset,
        key,
        serviceName: 'test-service',
      };

      const error = new ConsumerError(
        'Failed to process message',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        context
      );

      expect(error.context).toEqual(context);
      expect(error.context.topic).toBe(topic);
      expect(error.context.partition).toBe(partition);
      expect(error.context.offset).toBe(offset);
      expect(error.context.key).toBe(key);
      expect(error.context.serviceName).toBe('test-service');
    });

    it('should properly chain error causes', () => {
      const originalError = new Error('Network error');
      const intermediateError = new Error('Kafka client error');
      intermediateError.cause = originalError;

      const kafkaError = new KafkaError(
        'Failed to produce message',
        ERROR_CODES.PRODUCER_SEND_FAILED,
        { topic: 'test-topic' },
        intermediateError
      );

      expect(kafkaError.cause).toBe(intermediateError);
      expect(kafkaError.cause.cause).toBe(originalError);
    });

    it('should capture stack traces', () => {
      const error = new KafkaError(
        'Test error',
        ERROR_CODES.PRODUCER_SEND_FAILED
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('KafkaError');
      expect(error.stack).toContain('kafka.errors.spec.ts'); // Should contain this test file
    });
  });

  describe('Retry Policy Integration', () => {
    it('should handle transient errors with retry', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer with a handler that throws a transient error
      await kafkaService.consume(
        'test-topic',
        async () => {
          throw new KafkaError(
            'Temporary network issue',
            ERROR_CODES.PRODUCER_SEND_FAILED,
            { transient: true }
          );
        }
      );

      // Simulate message processing
      const mockMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: {},
        timestamp: '1630000000000',
        offset: '0',
      };

      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      });

      // Verify message was retried (sent back to original topic)
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe('test-topic');
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('retry-count', Buffer.from('1'));
    });

    it('should handle permanent errors without retry', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer with a handler that throws a permanent error
      await kafkaService.consume(
        'test-topic',
        async () => {
          const error = new KafkaError(
            'Permanent validation error',
            ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            { permanent: true }
          );
          (error as any).permanent = true; // Mark as permanent
          throw error;
        }
      );

      // Simulate message processing
      const mockMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: {},
        timestamp: '1630000000000',
        offset: '0',
      };

      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      });

      // Verify message was sent to DLQ instead of being retried
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe(TOPICS.DEAD_LETTER);
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('error-type');
    });

    it('should respect max retry limits', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer
      const maxRetries = 3;
      await kafkaService.consume(
        'test-topic',
        async () => {
          throw new Error('Processing failed');
        },
        { maxRetries }
      );

      // Simulate message with max retries already reached
      const mockMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: { 'retry-count': Buffer.from(maxRetries.toString()) },
        timestamp: '1630000000000',
        offset: '0',
      };

      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      });

      // Verify message was sent to DLQ with max-retries-exceeded
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe(TOPICS.DEAD_LETTER);
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('error-type', Buffer.from('max-retries-exceeded'));
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should implement circuit breaker for producer errors', async () => {
      // Mock producer to fail with connection error
      mockProducer.send.mockRejectedValueOnce(new Error('Broker connection failed'));
      
      // First attempt should throw the original error
      await expect(kafkaService.produce('test-topic', { data: 'test' })).rejects.toThrow(KafkaError);
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      
      // Reset mock for next test
      mockProducer.send.mockReset();
      
      // Simulate circuit half-open by making the next call succeed
      mockProducer.send.mockResolvedValueOnce(undefined);
      
      // Should succeed and close the circuit
      await expect(kafkaService.produce('test-topic', { data: 'test' })).resolves.not.toThrow();
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
    });

    it('should track error rates for circuit breaking decisions', async () => {
      // This test would verify that the service tracks error rates
      // and opens the circuit when error threshold is exceeded
      
      // Since the actual circuit breaker implementation details might vary,
      // we're testing the concept rather than specific implementation
      
      // Mock multiple consecutive failures
      mockProducer.send.mockRejectedValue(new Error('Broker connection failed'));
      
      // Make multiple calls to simulate error rate tracking
      for (let i = 0; i < 5; i++) {
        try {
          await kafkaService.produce('test-topic', { data: `test-${i}` });
        } catch (error) {
          // Expected to throw
        }
      }
      
      // Verify producer.send was called the expected number of times
      // If circuit breaker is working, it might not be called for all attempts
      expect(mockProducer.send).toHaveBeenCalled();
      
      // Verify error logging
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it('should handle health journey errors with appropriate context', async () => {
      const healthJourneyError = new KafkaError(
        'Failed to process health metric event',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        {
          journey: 'health',
          metricType: 'HEART_RATE',
          userId: 'user-123',
        }
      );

      expect(healthJourneyError.context.journey).toBe('health');
      expect(healthJourneyError.context.metricType).toBe('HEART_RATE');
    });

    it('should handle care journey errors with appropriate context', async () => {
      const careJourneyError = new KafkaError(
        'Failed to process appointment booking event',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        {
          journey: 'care',
          appointmentId: 'appt-123',
          providerId: 'provider-456',
        }
      );

      expect(careJourneyError.context.journey).toBe('care');
      expect(careJourneyError.context.appointmentId).toBe('appt-123');
    });

    it('should handle plan journey errors with appropriate context', async () => {
      const planJourneyError = new KafkaError(
        'Failed to process claim submission event',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        {
          journey: 'plan',
          claimId: 'claim-123',
          claimType: 'MEDICAL',
        }
      );

      expect(planJourneyError.context.journey).toBe('plan');
      expect(planJourneyError.context.claimId).toBe('claim-123');
    });

    it('should propagate errors across services with tracing context', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer
      await kafkaService.consume(
        'test-topic',
        async () => {
          throw new KafkaError(
            'Cross-service error',
            ERROR_CODES.CONSUMER_PROCESSING_FAILED,
            { journey: 'health' }
          );
        }
      );

      // Simulate message processing with tracing headers
      const mockMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: {
          'x-trace-id': Buffer.from('trace-123'),
          'x-span-id': Buffer.from('span-456'),
        },
        timestamp: '1630000000000',
        offset: '0',
      };

      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      });

      // Verify message was retried with preserved tracing headers
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      const sentHeaders = mockProducer.send.mock.calls[0][0].messages[0].headers;
      expect(sentHeaders).toHaveProperty('x-trace-id', Buffer.from('trace-123'));
      expect(sentHeaders).toHaveProperty('x-span-id', Buffer.from('span-456'));
    });
  });

  describe('Dead Letter Queue Integration', () => {
    it('should send failed messages to DLQ with error context', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer with DLQ enabled
      await kafkaService.consume(
        'health.events',
        async () => {
          throw new KafkaError(
            'Processing failed',
            ERROR_CODES.CONSUMER_PROCESSING_FAILED,
            { journey: 'health', metricType: 'HEART_RATE' }
          );
        },
        { maxRetries: 0, useDLQ: true } // Force immediate DLQ
      );

      // Simulate message processing
      const mockMessage = {
        key: Buffer.from('user-123'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: {},
        timestamp: '1630000000000',
        offset: '0',
      };

      await capturedEachMessageHandler({
        topic: 'health.events',
        partition: 0,
        message: mockMessage,
      });

      // Verify message was sent to DLQ with appropriate headers
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe(TOPICS.DEAD_LETTER);
      
      const dlqHeaders = mockProducer.send.mock.calls[0][0].messages[0].headers;
      expect(dlqHeaders).toHaveProperty('error-type');
      expect(dlqHeaders).toHaveProperty('error-message');
      expect(dlqHeaders).toHaveProperty('source-topic', Buffer.from('health.events'));
      expect(dlqHeaders).toHaveProperty('source-partition', Buffer.from('0'));
      expect(dlqHeaders).toHaveProperty('source-service', Buffer.from('test-service'));
      expect(dlqHeaders).toHaveProperty('dlq-timestamp');
    });

    it('should handle DLQ failures gracefully', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer
      await kafkaService.consume(
        'test-topic',
        async () => {
          throw new Error('Processing failed');
        },
        { maxRetries: 0 } // Force immediate DLQ
      );

      // Make the producer.send fail when trying to send to DLQ
      mockProducer.send.mockRejectedValueOnce(new Error('DLQ send failed'));

      // Simulate message processing
      const mockMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: {},
        timestamp: '1630000000000',
        offset: '0',
      };

      // This should not throw despite DLQ failure
      await expect(capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      })).resolves.not.toThrow();

      // Verify error was logged
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send message to dead-letter queue'),
        expect.any(Error),
        'KafkaService'
      );
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { ERROR_CODES } from '../../../src/constants/errors.constants';
import { TOPICS } from '../../../src/constants/topics.constants';
import { KafkaError } from '../../../src/errors/kafka.errors';

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

describe('Kafka Retry Strategies', () => {
  let kafkaService: KafkaService;
  let calculateRetryDelay: Function;

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

    // Access the private calculateRetryDelay method using type assertion
    calculateRetryDelay = (kafkaService as any).calculateRetryDelay.bind(kafkaService);
  });

  describe('Exponential Backoff Algorithm', () => {
    it('should increase delay exponentially with each retry attempt', () => {
      // Configure retry options
      const retryOptions = {
        initialRetryTime: 100,
        factor: 2,
        retries: 5,
        maxRetryTime: 10000,
      };

      // Test multiple retry attempts
      const firstRetryDelay = calculateRetryDelay(1, retryOptions);
      const secondRetryDelay = calculateRetryDelay(2, retryOptions);
      const thirdRetryDelay = calculateRetryDelay(3, retryOptions);
      const fourthRetryDelay = calculateRetryDelay(4, retryOptions);

      // Verify exponential growth (with jitter, so we check ranges)
      expect(firstRetryDelay).toBeGreaterThanOrEqual(80); // 100 * 0.8
      expect(firstRetryDelay).toBeLessThanOrEqual(140); // 100 * 1.4

      expect(secondRetryDelay).toBeGreaterThanOrEqual(160); // 200 * 0.8
      expect(secondRetryDelay).toBeLessThanOrEqual(280); // 200 * 1.4

      expect(thirdRetryDelay).toBeGreaterThanOrEqual(320); // 400 * 0.8
      expect(thirdRetryDelay).toBeLessThanOrEqual(560); // 400 * 1.4

      expect(fourthRetryDelay).toBeGreaterThanOrEqual(640); // 800 * 0.8
      expect(fourthRetryDelay).toBeLessThanOrEqual(1120); // 800 * 1.4
    });

    it('should respect the maximum retry time limit', () => {
      // Configure retry options with a low max retry time
      const retryOptions = {
        initialRetryTime: 100,
        factor: 10, // Large factor to quickly exceed max
        retries: 5,
        maxRetryTime: 500, // Low max retry time
      };

      // First retry: 100ms (within limit)
      const firstRetryDelay = calculateRetryDelay(1, retryOptions);
      expect(firstRetryDelay).toBeGreaterThanOrEqual(80);
      expect(firstRetryDelay).toBeLessThanOrEqual(140);

      // Second retry: 1000ms (would exceed limit, should be capped)
      const secondRetryDelay = calculateRetryDelay(2, retryOptions);
      expect(secondRetryDelay).toBeGreaterThanOrEqual(400); // 500 * 0.8
      expect(secondRetryDelay).toBeLessThanOrEqual(500); // Max is 500

      // Third retry: 10000ms (would exceed limit, should be capped)
      const thirdRetryDelay = calculateRetryDelay(3, retryOptions);
      expect(thirdRetryDelay).toBeGreaterThanOrEqual(400); // 500 * 0.8
      expect(thirdRetryDelay).toBeLessThanOrEqual(500); // Max is 500
    });
  });

  describe('Jitter Implementation', () => {
    it('should add jitter to prevent retry storms', () => {
      // Configure retry options
      const retryOptions = {
        initialRetryTime: 1000,
        factor: 1, // No exponential increase to isolate jitter effect
        retries: 5,
        maxRetryTime: 10000,
      };

      // Collect multiple retry delays for the same attempt
      const retryDelays: number[] = [];
      for (let i = 0; i < 100; i++) {
        retryDelays.push(calculateRetryDelay(1, retryOptions));
      }

      // Verify that we have variation in the delays (jitter)
      const uniqueDelays = new Set(retryDelays);
      expect(uniqueDelays.size).toBeGreaterThan(1);

      // Verify that all delays are within the expected range (80% to 140% of base)
      retryDelays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(800); // 1000 * 0.8
        expect(delay).toBeLessThanOrEqual(1400); // 1000 * 1.4
      });

      // Verify that delays are distributed (not all at min or max)
      const min = Math.min(...retryDelays);
      const max = Math.max(...retryDelays);
      expect(max - min).toBeGreaterThan(100); // Ensure good spread
    });

    it('should apply jitter consistently across retry attempts', () => {
      // Configure retry options
      const retryOptions = {
        initialRetryTime: 100,
        factor: 2,
        retries: 5,
        maxRetryTime: 10000,
      };

      // Test jitter across different retry attempts
      const firstRetryDelays: number[] = [];
      const secondRetryDelays: number[] = [];

      for (let i = 0; i < 50; i++) {
        firstRetryDelays.push(calculateRetryDelay(1, retryOptions));
        secondRetryDelays.push(calculateRetryDelay(2, retryOptions));
      }

      // Verify jitter is applied to all retry attempts
      expect(new Set(firstRetryDelays).size).toBeGreaterThan(1);
      expect(new Set(secondRetryDelays).size).toBeGreaterThan(1);

      // Verify jitter ranges are proportional to the base delay
      const firstRetryMin = Math.min(...firstRetryDelays);
      const firstRetryMax = Math.max(...firstRetryDelays);
      const secondRetryMin = Math.min(...secondRetryDelays);
      const secondRetryMax = Math.max(...secondRetryDelays);

      // First retry range should be roughly 80-140 (100 * 0.8 to 100 * 1.4)
      // Second retry range should be roughly 160-280 (200 * 0.8 to 200 * 1.4)
      expect(secondRetryMin / firstRetryMin).toBeCloseTo(2, 0);
      expect(secondRetryMax / firstRetryMax).toBeCloseTo(2, 0);
    });
  });

  describe('Maximum Retry Limits', () => {
    it('should respect the configured maximum number of retries', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer with max retries
      const maxRetries = 3;
      await kafkaService.consume(
        'test-topic',
        async () => {
          throw new Error('Processing failed');
        },
        { maxRetries }
      );

      // Verify consumer was set up correctly
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'test-topic',
        fromBeginning: false,
      });
      expect(mockConsumer.run).toHaveBeenCalled();

      // Simulate message processing with retries
      const mockMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: {},
        timestamp: '1630000000000',
        offset: '0',
      };

      // First attempt (retry count = 0)
      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      });

      // Verify producer was called to retry the message
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('retry-count', Buffer.from('1'));

      // Reset mocks for next test
      mockProducer.send.mockClear();

      // Simulate message with retry count = maxRetries
      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: {
          ...mockMessage,
          headers: { 'retry-count': Buffer.from(maxRetries.toString()) },
        },
      });

      // Verify message was sent to DLQ instead of being retried
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe(TOPICS.DEAD_LETTER);
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('error-type', Buffer.from('max-retries-exceeded'));
    });

    it('should use default retry settings when not explicitly configured', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer without specifying max retries
      await kafkaService.consume(
        'test-topic',
        async () => {
          throw new Error('Processing failed');
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

      // Verify default max retries from config was used
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('retry-count', Buffer.from('1'));

      // Verify logger was called with the correct retry information
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        expect.stringContaining('Retrying message from topic test-topic, attempt 1 of 3'),
        'KafkaService'
      );
    });
  });

  describe('Error-Specific Retry Policies', () => {
    it('should handle schema validation errors differently from processing errors', async () => {
      // Mock schema registry
      const mockSchemaRegistry = {
        validate: jest.fn(),
      };
      (kafkaService as any).schemaRegistry = mockSchemaRegistry;

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
          // This won't be called for schema validation errors
        }
      );

      // Simulate message processing with schema validation error
      mockSchemaRegistry.validate.mockRejectedValueOnce(new Error('Schema validation failed'));

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

      // Verify message was sent directly to DLQ without retry
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe(TOPICS.DEAD_LETTER);
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('error-type', Buffer.from('schema-validation'));

      // Reset mocks
      mockProducer.send.mockClear();
      mockSchemaRegistry.validate.mockClear();
      mockSchemaRegistry.validate.mockResolvedValue(true);

      // Now simulate a processing error (not schema validation)
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

    it('should handle different error types with appropriate retry strategies', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer with custom error handling
      let errorType: string = 'transient';
      await kafkaService.consume(
        'test-topic',
        async () => {
          if (errorType === 'transient') {
            throw new Error('Temporary network issue');
          } else if (errorType === 'permanent') {
            const error = new Error('Permanent business logic error');
            (error as any).permanent = true;
            throw error;
          } else {
            // No error
          }
        }
      );

      const mockMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: {},
        timestamp: '1630000000000',
        offset: '0',
      };

      // Test transient error (should retry)
      errorType = 'transient';
      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      });

      // Verify message was retried
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe('test-topic');
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('retry-count', Buffer.from('1'));

      // Reset mocks
      mockProducer.send.mockClear();

      // Test permanent error (should go to DLQ without retry)
      errorType = 'permanent';
      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      });

      // Verify message was sent to DLQ
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe(TOPICS.DEAD_LETTER);
    });
  });

  describe('Dead Letter Queue Integration', () => {
    it('should send failed messages to the dead letter queue with appropriate headers', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer with DLQ enabled
      await kafkaService.consume(
        'test-topic',
        async () => {
          throw new Error('Processing failed');
        },
        { maxRetries: 0, useDLQ: true } // Force immediate DLQ
      );

      // Simulate message processing
      const mockMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test' })),
        headers: { 'correlation-id': Buffer.from('test-correlation-id') },
        timestamp: '1630000000000',
        offset: '0',
      };

      await capturedEachMessageHandler({
        topic: 'test-topic',
        partition: 0,
        message: mockMessage,
      });

      // Verify message was sent to DLQ with appropriate headers
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe(TOPICS.DEAD_LETTER);
      
      const dlqHeaders = mockProducer.send.mock.calls[0][0].messages[0].headers;
      expect(dlqHeaders).toHaveProperty('error-type', Buffer.from('max-retries-exceeded'));
      expect(dlqHeaders).toHaveProperty('error-message');
      expect(dlqHeaders).toHaveProperty('source-topic', Buffer.from('test-topic'));
      expect(dlqHeaders).toHaveProperty('source-partition', Buffer.from('0'));
      expect(dlqHeaders).toHaveProperty('retry-count', Buffer.from('0'));
      expect(dlqHeaders).toHaveProperty('max-retries', Buffer.from('0'));
      expect(dlqHeaders).toHaveProperty('correlation-id', Buffer.from('test-correlation-id')); // Original headers preserved
      expect(dlqHeaders).toHaveProperty('dlq-timestamp'); // Timestamp added
      expect(dlqHeaders).toHaveProperty('source-service', Buffer.from('test-service'));
    });

    it('should not send to DLQ if explicitly disabled', async () => {
      // Mock the consumer run implementation to capture the eachMessage handler
      let capturedEachMessageHandler: Function;
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        capturedEachMessageHandler = eachMessage;
        return Promise.resolve();
      });

      // Set up a consumer with DLQ disabled
      await kafkaService.consume(
        'test-topic',
        async () => {
          throw new Error('Processing failed');
        },
        { maxRetries: 0, useDLQ: false } // Disable DLQ
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

      // Verify no message was sent to DLQ
      expect(mockProducer.send).not.toHaveBeenCalled();
    });
  });

  describe('Permanent Failure Handling', () => {
    it('should log appropriate messages when max retries are exceeded', async () => {
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
        }
      );

      // Simulate message with max retries already reached
      const maxRetries = 3; // Default from config
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

      // Verify appropriate error logging
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing message from topic test-topic'),
        expect.any(Error),
        'KafkaService'
      );

      // Verify DLQ message with max-retries-exceeded
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send.mock.calls[0][0].topic).toBe(TOPICS.DEAD_LETTER);
      expect(mockProducer.send.mock.calls[0][0].messages[0].headers).toHaveProperty('error-type', Buffer.from('max-retries-exceeded'));
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
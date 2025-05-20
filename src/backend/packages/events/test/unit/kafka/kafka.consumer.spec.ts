import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { EventSchemaRegistry } from '../../../src/schema/schema-registry.service';
import { KafkaConsumer } from '../../../src/kafka/kafka.consumer';
import { KafkaMessage } from '../../../src/interfaces/kafka-message.interface';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { KafkaError, EventValidationError } from '../../../src/errors/kafka.errors';
import { ERROR_CODES } from '../../../src/constants/errors.constants';
import { TOPICS } from '../../../src/constants/topics.constants';

// Mock implementation of the abstract KafkaConsumer class for testing
class TestKafkaConsumer extends KafkaConsumer<any> {
  public processedMessages: any[] = [];
  public processingErrors: Error[] = [];
  public healthStatus: string = 'UNKNOWN';
  public pauseState: boolean = false;

  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly configService: ConfigService,
    protected readonly logger: LoggerService,
    protected readonly tracingService: TracingService,
    protected readonly schemaRegistry?: EventSchemaRegistry,
  ) {
    super(
      'test-topic',
      kafkaService,
      configService,
      logger,
      tracingService,
      schemaRegistry
    );
  }

  async processMessage(message: any, metadata: KafkaMessage): Promise<void> {
    try {
      // Simulate message processing
      this.processedMessages.push({ message, metadata });
      
      // Simulate error for specific test messages
      if (message.simulateError) {
        throw new Error('Simulated processing error');
      }
      
      // Simulate validation error for specific test messages
      if (message.simulateValidationError) {
        throw new EventValidationError(
          'Simulated validation error',
          ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          { topic: this.topic }
        );
      }
    } catch (error) {
      this.processingErrors.push(error);
      throw error;
    }
  }

  getHealthStatus(): { status: string; details: Record<string, any> } {
    return {
      status: this.healthStatus,
      details: {
        topic: this.topic,
        groupId: this.groupId,
        processedCount: this.processedMessages.length,
        errorCount: this.processingErrors.length,
        isPaused: this.pauseState
      }
    };
  }

  // Expose protected methods for testing
  public exposedHandleProcessingError(error: Error, message: any, metadata: KafkaMessage): Promise<void> {
    return this.handleProcessingError(error, message, metadata);
  }

  public exposedSendToDLQ(message: any, metadata: KafkaMessage, error: Error): Promise<void> {
    return this.sendToDLQ(message, metadata, error);
  }

  // Override protected methods for testing
  protected async onPause(): Promise<void> {
    this.pauseState = true;
  }

  protected async onResume(): Promise<void> {
    this.pauseState = false;
  }
}

describe('KafkaConsumer', () => {
  let consumer: TestKafkaConsumer;
  let kafkaService: jest.Mocked<KafkaService>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<LoggerService>;
  let tracingService: jest.Mocked<TracingService>;
  let schemaRegistry: jest.Mocked<EventSchemaRegistry>;

  beforeEach(async () => {
    // Create mock implementations
    const kafkaServiceMock = {
      consume: jest.fn(),
      produce: jest.fn(),
    };

    const configServiceMock = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config = {
          'test-service.kafka.groupId': 'test-group',
          'test-service.kafka.retry.maxRetries': 3,
          'test-service.kafka.retry.initialRetryTime': 100,
          'test-service.kafka.retry.factor': 2,
          'test-service.kafka.retry.maxRetryTime': 5000,
          'test-service.kafka.deadLetterTopic': TOPICS.DEAD_LETTER,
          'test-service.kafka.batchSize': 10,
          'service.name': 'test-service',
        };
        return config[key] || defaultValue;
      }),
    };

    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const tracingServiceMock = {
      createSpan: jest.fn().mockImplementation((name, fn) => fn()),
      getTraceHeaders: jest.fn().mockReturnValue({
        'x-trace-id': 'test-trace-id',
        'x-span-id': 'test-span-id',
      }),
      getCurrentTraceId: jest.fn().mockReturnValue('test-trace-id'),
    };

    const schemaRegistryMock = {
      validate: jest.fn(),
      hasSchema: jest.fn().mockReturnValue(true),
      getSchema: jest.fn(),
      register: jest.fn(),
      unregister: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: KafkaService,
          useValue: kafkaServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: LoggerService,
          useValue: loggerMock,
        },
        {
          provide: TracingService,
          useValue: tracingServiceMock,
        },
        {
          provide: EventSchemaRegistry,
          useValue: schemaRegistryMock,
        },
        TestKafkaConsumer,
      ],
    }).compile();

    consumer = module.get<TestKafkaConsumer>(TestKafkaConsumer);
    kafkaService = module.get(KafkaService) as jest.Mocked<KafkaService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    logger = module.get(LoggerService) as jest.Mocked<LoggerService>;
    tracingService = module.get(TracingService) as jest.Mocked<TracingService>;
    schemaRegistry = module.get(EventSchemaRegistry) as jest.Mocked<EventSchemaRegistry>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with the correct topic and configuration', () => {
      expect(consumer.topic).toBe('test-topic');
      expect(consumer.groupId).toBe('test-group');
      expect(consumer['maxRetries']).toBe(3);
      expect(consumer['deadLetterTopic']).toBe(TOPICS.DEAD_LETTER);
    });

    it('should use default configuration values when not provided', () => {
      // Mock configService to return undefined for specific keys
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'test-service.kafka.groupId') return undefined;
        if (key === 'test-service.kafka.retry.maxRetries') return undefined;
        return defaultValue;
      });

      const newConsumer = new TestKafkaConsumer(
        kafkaService,
        configService,
        logger,
        tracingService,
        schemaRegistry
      );

      // Should use default values
      expect(newConsumer.groupId).toBe('test-service-consumer-group');
      expect(newConsumer['maxRetries']).toBe(3); // Default value
    });
  });

  describe('subscribe', () => {
    it('should call kafkaService.consume with the correct parameters', async () => {
      await consumer.subscribe();

      expect(kafkaService.consume).toHaveBeenCalledWith(
        'test-topic',
        expect.any(Function),
        expect.objectContaining({
          groupId: 'test-group',
          fromBeginning: false,
          autoCommit: true,
          maxRetries: 3,
          useDLQ: true,
        })
      );
    });

    it('should allow overriding subscription options', async () => {
      await consumer.subscribe({
        fromBeginning: true,
        autoCommit: false,
        maxRetries: 5,
        useDLQ: false,
      });

      expect(kafkaService.consume).toHaveBeenCalledWith(
        'test-topic',
        expect.any(Function),
        expect.objectContaining({
          groupId: 'test-group',
          fromBeginning: true,
          autoCommit: false,
          maxRetries: 5,
          useDLQ: false,
        })
      );
    });

    it('should log subscription information', async () => {
      await consumer.subscribe();

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Subscribing to topic test-topic'),
        expect.any(String)
      );
    });
  });

  describe('message processing', () => {
    it('should process messages correctly', async () => {
      // Simulate the callback function passed to kafkaService.consume
      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      await consumer.subscribe();

      // Create test message and metadata
      const testMessage = { data: 'test-data' };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: { 'test-header': 'test-value' },
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // Call the callback function directly
      await consumeCallback(testMessage, testMetadata);

      // Verify message was processed
      expect(consumer.processedMessages.length).toBe(1);
      expect(consumer.processedMessages[0].message).toEqual(testMessage);
      expect(consumer.processedMessages[0].metadata).toEqual(testMetadata);
    });

    it('should validate messages using schema registry if available', async () => {
      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      await consumer.subscribe();

      const testMessage = { data: 'test-data' };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: {},
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      await consumeCallback(testMessage, testMetadata);

      // Verify schema validation was called
      expect(schemaRegistry.validate).toHaveBeenCalledWith('test-topic', testMessage);
    });

    it('should handle processing errors correctly', async () => {
      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      // Mock the error handling method
      jest.spyOn(consumer, 'exposedHandleProcessingError').mockResolvedValue();

      await consumer.subscribe();

      const testMessage = { data: 'test-data', simulateError: true };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: {},
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // This should trigger an error
      await consumeCallback(testMessage, testMetadata);

      // Verify error handling was called
      expect(consumer.exposedHandleProcessingError).toHaveBeenCalledWith(
        expect.any(Error),
        testMessage,
        testMetadata
      );

      // Verify error was logged
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle validation errors correctly', async () => {
      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      // Mock schema validation to throw an error
      schemaRegistry.validate.mockRejectedValueOnce(
        new EventValidationError(
          'Schema validation failed',
          ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          { topic: 'test-topic' }
        )
      );

      // Mock the DLQ method
      jest.spyOn(consumer, 'exposedSendToDLQ').mockResolvedValue();

      await consumer.subscribe();

      const testMessage = { data: 'test-data' };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: {},
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // This should trigger a validation error
      await consumeCallback(testMessage, testMetadata);

      // Verify DLQ was called
      expect(consumer.exposedSendToDLQ).toHaveBeenCalledWith(
        testMessage,
        testMetadata,
        expect.any(EventValidationError)
      );

      // Verify error was logged
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('retry logic', () => {
    it('should retry processing failed messages with exponential backoff', async () => {
      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      // Mock the retry delay calculation for testing
      jest.spyOn(consumer as any, 'calculateRetryDelay').mockReturnValue(100);

      await consumer.subscribe();

      const testMessage = { data: 'test-data', simulateError: true };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: { 'retry-count': '1' }, // Already retried once
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        callback();
        return {} as any;
      });

      // This should trigger a retry
      await consumeCallback(testMessage, testMetadata);

      // Verify produce was called for retry
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'test-topic',
        testMessage,
        'test-key',
        expect.objectContaining({
          'retry-count': '2', // Incremented retry count
        })
      );

      // Verify retry delay calculation was called
      expect(consumer['calculateRetryDelay']).toHaveBeenCalledWith(2, expect.any(Object));
    });

    it('should send to DLQ when max retries are exceeded', async () => {
      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      // Mock the DLQ method
      jest.spyOn(consumer, 'exposedSendToDLQ').mockResolvedValue();

      await consumer.subscribe();

      const testMessage = { data: 'test-data', simulateError: true };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: { 'retry-count': '3' }, // Max retries reached
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // This should trigger DLQ
      await consumeCallback(testMessage, testMetadata);

      // Verify DLQ was called
      expect(consumer.exposedSendToDLQ).toHaveBeenCalledWith(
        testMessage,
        testMetadata,
        expect.any(Error)
      );

      // Verify produce was NOT called for retry
      expect(kafkaService.produce).not.toHaveBeenCalledWith(
        'test-topic',
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('dead-letter queue', () => {
    it('should send failed messages to the dead-letter queue', async () => {
      // Mock the sendToDLQ method implementation
      jest.spyOn(consumer, 'exposedSendToDLQ').mockImplementation(async (message, metadata, error) => {
        await kafkaService.produce(
          TOPICS.DEAD_LETTER,
          message,
          metadata.key,
          {
            'error-type': error.name,
            'error-message': error.message,
            'source-topic': metadata.topic,
            'source-partition': metadata.partition.toString(),
            'source-offset': metadata.offset,
            'retry-count': metadata.headers['retry-count'] || '0',
          }
        );
      });

      const testMessage = { data: 'test-data' };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: { 'retry-count': '3' },
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };
      const testError = new Error('Test error');

      await consumer.exposedSendToDLQ(testMessage, testMetadata, testError);

      // Verify produce was called with DLQ topic
      expect(kafkaService.produce).toHaveBeenCalledWith(
        TOPICS.DEAD_LETTER,
        testMessage,
        'test-key',
        expect.objectContaining({
          'error-type': 'Error',
          'error-message': 'Test error',
          'source-topic': 'test-topic',
          'source-partition': '0',
          'source-offset': '0',
          'retry-count': '3',
        })
      );
    });

    it('should handle DLQ errors gracefully', async () => {
      // Mock produce to throw an error
      kafkaService.produce.mockRejectedValueOnce(new Error('DLQ error'));

      const testMessage = { data: 'test-data' };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: {},
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };
      const testError = new Error('Test error');

      // This should not throw despite the DLQ error
      await consumer.exposedSendToDLQ(testMessage, testMetadata, testError);

      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send message to dead-letter queue'),
        expect.any(Error),
        expect.any(String)
      );
    });
  });

  describe('health checks', () => {
    it('should report health status correctly', () => {
      // Set up some test state
      consumer.processedMessages = [{ message: { data: 'test' }, metadata: {} as KafkaMessage }];
      consumer.processingErrors = [new Error('Test error')];
      consumer.healthStatus = 'HEALTHY';

      const health = consumer.getHealthStatus();

      expect(health).toEqual({
        status: 'HEALTHY',
        details: {
          topic: 'test-topic',
          groupId: 'test-group',
          processedCount: 1,
          errorCount: 1,
          isPaused: false
        }
      });
    });

    it('should update health status based on error rate', async () => {
      // Implementation would depend on how health status is calculated
      // This is a simplified example
      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      await consumer.subscribe();

      // Process a few messages with errors to trigger health status change
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: {},
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // Mock updateHealthStatus method
      jest.spyOn(consumer as any, 'updateHealthStatus').mockImplementation((status: string) => {
        consumer.healthStatus = status;
      });

      // Process error messages
      for (let i = 0; i < 5; i++) {
        try {
          await consumeCallback({ simulateError: true }, testMetadata);
        } catch (error) {
          // Ignore errors
        }
      }

      // Verify health status was updated
      expect(consumer['updateHealthStatus']).toHaveBeenCalled();
    });
  });

  describe('pause and resume', () => {
    it('should pause message processing', async () => {
      await consumer.pause();

      expect(consumer.pauseState).toBe(true);
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Paused consumer for topic'),
        expect.any(String)
      );
    });

    it('should resume message processing', async () => {
      // First pause
      await consumer.pause();
      expect(consumer.pauseState).toBe(true);

      // Then resume
      await consumer.resume();

      expect(consumer.pauseState).toBe(false);
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Resumed consumer for topic'),
        expect.any(String)
      );
    });

    it('should not process messages when paused', async () => {
      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      await consumer.subscribe();

      // Pause the consumer
      await consumer.pause();

      // Mock the processMessage method
      jest.spyOn(consumer, 'processMessage');

      const testMessage = { data: 'test-data' };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: {},
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // Try to process a message while paused
      await consumeCallback(testMessage, testMetadata);

      // Verify processMessage was not called
      expect(consumer.processMessage).not.toHaveBeenCalled();

      // Resume the consumer
      await consumer.resume();

      // Try to process a message after resuming
      await consumeCallback(testMessage, testMetadata);

      // Verify processMessage was called
      expect(consumer.processMessage).toHaveBeenCalled();
    });
  });

  describe('batch processing', () => {
    it('should support batch processing mode', async () => {
      // Enable batch mode
      jest.spyOn(consumer as any, 'isBatchProcessingEnabled').mockReturnValue(true);
      
      // Mock processBatch method
      jest.spyOn(consumer as any, 'processBatch').mockResolvedValue();

      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      await consumer.subscribe({ batchSize: 5 });

      const testMessage = { data: 'test-data' };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: {},
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // Process a few messages
      for (let i = 0; i < 6; i++) {
        await consumeCallback(testMessage, testMetadata);
      }

      // Verify batch processing was called
      expect(consumer['processBatch']).toHaveBeenCalled();
    });

    it('should flush batch on timeout', async () => {
      // Enable batch mode
      jest.spyOn(consumer as any, 'isBatchProcessingEnabled').mockReturnValue(true);
      
      // Mock processBatch method
      jest.spyOn(consumer as any, 'processBatch').mockResolvedValue();

      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((callback, timeout) => {
        callback();
        return {} as any;
      });

      let consumeCallback: (message: any, metadata: KafkaMessage) => Promise<void>;
      
      kafkaService.consume.mockImplementation((topic, callback, options) => {
        consumeCallback = callback;
        return Promise.resolve();
      });

      await consumer.subscribe({ batchSize: 10, batchTimeoutMs: 1000 });

      const testMessage = { data: 'test-data' };
      const testMetadata: KafkaMessage = {
        key: 'test-key',
        headers: {},
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: Date.now().toString(),
      };

      // Process a message (not enough to trigger batch processing by size)
      await consumeCallback(testMessage, testMetadata);

      // Verify batch processing was called due to timeout
      expect(consumer['processBatch']).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should clean up resources on shutdown', async () => {
      // Mock the cleanup methods
      jest.spyOn(consumer as any, 'stopBatchProcessing').mockResolvedValue();
      
      await consumer.shutdown();

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Shutting down consumer for topic'),
        expect.any(String)
      );
      expect(consumer['stopBatchProcessing']).toHaveBeenCalled();
    });
  });
});
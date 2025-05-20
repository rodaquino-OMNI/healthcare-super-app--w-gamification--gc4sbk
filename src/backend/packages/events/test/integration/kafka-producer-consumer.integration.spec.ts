import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from '../../src/kafka/kafka.service';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { EventMetadataDto, createEventMetadata } from '../../src/dto/event-metadata.dto';
import { KafkaMessage } from '../../src/interfaces/kafka-message.interface';
import { TOPICS } from '../../src/constants/topics.constants';
import { EventSchemaRegistry } from '../../src/schema/schema-registry.service';
import { KafkaError } from '../../src/errors/kafka.errors';
import { ERROR_CODES } from '../../src/constants/errors.constants';

// Mock implementations
class MockLoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
}

class MockTracingService {
  createSpan = jest.fn().mockImplementation((name, fn) => fn({ setAttribute: jest.fn() }));
  getTraceHeaders = jest.fn().mockReturnValue({ 'trace-id': 'test-trace-id' });
  getCurrentTraceId = jest.fn().mockReturnValue('test-trace-id');
}

class MockSchemaRegistry {
  validate = jest.fn().mockResolvedValue(true);
}

// Test configuration
const testConfig = {
  'test-service': {
    kafka: {
      brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
      clientId: 'test-client',
      groupId: 'test-group',
      ssl: false,
      retry: {
        initialRetryTime: 100,
        retries: 3,
        factor: 1.5,
        maxRetryTime: 2000,
      },
    },
  },
  service: {
    name: 'test-service',
  },
};

// Test fixtures
interface TestEvent {
  type: string;
  payload: any;
  metadata?: EventMetadataDto;
}

const createTestEvent = (type: string, payload: any): TestEvent => ({
  type,
  payload,
  metadata: createEventMetadata('test-service', {
    correlationId: 'test-correlation-id',
  }),
});

/**
 * Integration tests for Kafka producer and consumer interactions.
 * 
 * These tests verify the end-to-end functionality of the Kafka messaging system,
 * including message serialization/deserialization, header propagation, correlation ID
 * tracking, and error handling with retry mechanisms.
 * 
 * Note: These tests require a running Kafka broker. In CI environments, this is provided
 * by a Docker container started before the tests run.
 */
describe('Kafka Producer-Consumer Integration', () => {
  let moduleRef: TestingModule;
  let kafkaService: KafkaService;
  let configService: ConfigService;
  let loggerService: MockLoggerService;
  let tracingService: MockTracingService;
  let schemaRegistry: MockSchemaRegistry;
  
  // Test topic names
  const TEST_TOPIC = 'test.events';
  const TEST_RETRY_TOPIC = 'test.retry';
  const TEST_ERROR_TOPIC = 'test.error';
  
  beforeAll(async () => {
    // Create test module with real KafkaService and mocked dependencies
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [() => testConfig],
          isGlobal: true,
        }),
      ],
      providers: [
        KafkaService,
        {
          provide: LoggerService,
          useClass: MockLoggerService,
        },
        {
          provide: TracingService,
          useClass: MockTracingService,
        },
        {
          provide: EventSchemaRegistry,
          useClass: MockSchemaRegistry,
        },
      ],
    }).compile();
    
    kafkaService = moduleRef.get<KafkaService>(KafkaService);
    configService = moduleRef.get<ConfigService>(ConfigService);
    loggerService = moduleRef.get(LoggerService) as unknown as MockLoggerService;
    tracingService = moduleRef.get(TracingService) as unknown as MockTracingService;
    schemaRegistry = moduleRef.get(EventSchemaRegistry) as unknown as MockSchemaRegistry;
    
    // Initialize Kafka service
    await kafkaService.onModuleInit();
  }, 30000); // Increase timeout for Kafka connection
  
  afterAll(async () => {
    // Clean up Kafka service
    await kafkaService.onModuleDestroy();
    await moduleRef.close();
  }, 10000);
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  /**
   * Tests basic message production and consumption with verification of message content.
   */
  it('should successfully produce and consume a message', async () => {
    // Create test event
    const testEvent = createTestEvent('TEST_EVENT', { value: 'test-value' });
    
    // Set up consumer with message verification
    const messagePromise = new Promise<TestEvent>((resolve) => {
      kafkaService.consume<TestEvent>(
        TEST_TOPIC,
        async (message, metadata) => {
          // Verify message content
          expect(message).toBeDefined();
          expect(message.type).toBe(testEvent.type);
          expect(message.payload).toEqual(testEvent.payload);
          expect(message.metadata).toBeDefined();
          expect(message.metadata.correlationId).toBe('test-correlation-id');
          
          // Verify metadata
          expect(metadata).toBeDefined();
          expect(metadata.topic).toBe(TEST_TOPIC);
          expect(metadata.headers).toBeDefined();
          expect(metadata.headers['trace-id']).toBe('test-trace-id');
          
          resolve(message);
        },
        {
          groupId: 'test-consumer-group',
          fromBeginning: true,
        }
      );
    });
    
    // Wait for consumer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce test message
    await kafkaService.produce(TEST_TOPIC, testEvent);
    
    // Wait for message to be consumed
    const consumedMessage = await messagePromise;
    expect(consumedMessage).toBeDefined();
    
    // Verify tracing was used
    expect(tracingService.createSpan).toHaveBeenCalledWith(
      `kafka.produce.${TEST_TOPIC}`,
      expect.any(Function)
    );
    expect(tracingService.getTraceHeaders).toHaveBeenCalled();
  }, 15000);
  
  /**
   * Tests batch message production and consumption with verification of all messages.
   */
  it('should successfully produce and consume a batch of messages', async () => {
    // Create test events
    const testEvents = [
      createTestEvent('BATCH_EVENT_1', { index: 0 }),
      createTestEvent('BATCH_EVENT_2', { index: 1 }),
      createTestEvent('BATCH_EVENT_3', { index: 2 }),
    ];
    
    // Track consumed messages
    const consumedMessages: TestEvent[] = [];
    
    // Set up consumer with message verification
    const messagesPromise = new Promise<TestEvent[]>((resolve) => {
      kafkaService.consume<TestEvent>(
        TEST_TOPIC,
        async (message, metadata) => {
          // Only collect batch events
          if (message.type.startsWith('BATCH_EVENT_')) {
            consumedMessages.push(message);
            
            // Resolve when all messages are consumed
            if (consumedMessages.length === testEvents.length) {
              resolve(consumedMessages);
            }
          }
        },
        {
          groupId: 'test-batch-consumer-group',
          fromBeginning: true,
        }
      );
    });
    
    // Wait for consumer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce batch of messages
    await kafkaService.produceBatch(
      TEST_TOPIC,
      testEvents.map(event => ({ value: event }))
    );
    
    // Wait for all messages to be consumed
    const result = await messagesPromise;
    
    // Verify all messages were consumed
    expect(result.length).toBe(testEvents.length);
    
    // Verify each message was consumed correctly
    testEvents.forEach(event => {
      const consumed = result.find(msg => msg.type === event.type);
      expect(consumed).toBeDefined();
      expect(consumed.payload).toEqual(event.payload);
    });
  }, 15000);
  
  /**
   * Tests message header propagation between producer and consumer.
   */
  it('should propagate headers from producer to consumer', async () => {
    // Create test event
    const testEvent = createTestEvent('HEADER_TEST', { value: 'header-test' });
    
    // Custom headers to propagate
    const customHeaders = {
      'test-header-1': 'value-1',
      'test-header-2': 'value-2',
      'x-request-id': 'test-request-id',
    };
    
    // Set up consumer with header verification
    const headerPromise = new Promise<Record<string, string>>((resolve) => {
      kafkaService.consume<TestEvent>(
        TEST_TOPIC,
        async (message, metadata) => {
          if (message.type === 'HEADER_TEST') {
            resolve(metadata.headers);
          }
        },
        {
          groupId: 'test-header-consumer-group',
          fromBeginning: true,
        }
      );
    });
    
    // Wait for consumer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce message with custom headers
    await kafkaService.produce(
      TEST_TOPIC,
      testEvent,
      'header-test-key',
      customHeaders
    );
    
    // Wait for message to be consumed
    const headers = await headerPromise;
    
    // Verify custom headers were propagated
    expect(headers).toBeDefined();
    Object.entries(customHeaders).forEach(([key, value]) => {
      expect(headers[key]).toBe(value);
    });
    
    // Verify tracing headers were added
    expect(headers['trace-id']).toBe('test-trace-id');
  }, 15000);
  
  /**
   * Tests correlation ID tracking across producer and consumer.
   */
  it('should track correlation IDs across producer and consumer', async () => {
    // Create test event with specific correlation ID
    const correlationId = 'test-correlation-' + Date.now();
    const testEvent = createTestEvent('CORRELATION_TEST', { value: 'correlation-test' });
    testEvent.metadata.correlationId = correlationId;
    
    // Set up consumer with correlation ID verification
    const correlationPromise = new Promise<string>((resolve) => {
      kafkaService.consume<TestEvent>(
        TEST_TOPIC,
        async (message, metadata) => {
          if (message.type === 'CORRELATION_TEST' && 
              message.payload.value === 'correlation-test') {
            resolve(message.metadata.correlationId);
          }
        },
        {
          groupId: 'test-correlation-consumer-group',
          fromBeginning: true,
        }
      );
    });
    
    // Wait for consumer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce message with correlation ID
    await kafkaService.produce(TEST_TOPIC, testEvent);
    
    // Wait for message to be consumed
    const receivedCorrelationId = await correlationPromise;
    
    // Verify correlation ID was preserved
    expect(receivedCorrelationId).toBe(correlationId);
  }, 15000);
  
  /**
   * Tests retry mechanism with exponential backoff for failed message processing.
   */
  it('should retry failed message processing with exponential backoff', async () => {
    // Create test event
    const testEvent = createTestEvent('RETRY_TEST', { value: 'retry-test' });
    
    // Track processing attempts
    const processingAttempts: number[] = [];
    
    // Set up consumer that fails on first attempts
    const retryPromise = new Promise<number[]>((resolve) => {
      kafkaService.consume<TestEvent>(
        TEST_RETRY_TOPIC,
        async (message, metadata) => {
          if (message.type === 'RETRY_TEST') {
            const retryCount = parseInt(metadata.headers['retry-count'] || '0', 10);
            processingAttempts.push(retryCount);
            
            // Fail on first two attempts
            if (retryCount < 2) {
              throw new Error('Simulated processing failure');
            }
            
            // Succeed on third attempt
            if (retryCount === 2) {
              resolve(processingAttempts);
            }
          }
        },
        {
          groupId: 'test-retry-consumer-group',
          fromBeginning: true,
          maxRetries: 3,
          retryDelay: 500, // Start with 500ms delay
          useDLQ: true,
        }
      );
    });
    
    // Wait for consumer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce message that will trigger retries
    await kafkaService.produce(TEST_RETRY_TOPIC, testEvent);
    
    // Wait for message to be processed successfully after retries
    const attempts = await retryPromise;
    
    // Verify retry attempts
    expect(attempts.length).toBeGreaterThanOrEqual(3); // Original + 2 retries
    expect(attempts).toEqual([0, 1, 2]); // Retry counts should be sequential
    
    // Verify error logging
    expect(loggerService.error).toHaveBeenCalledWith(
      expect.stringContaining('Error processing message from topic'),
      expect.any(Error),
      'KafkaService'
    );
  }, 20000);
  
  /**
   * Tests dead letter queue functionality for messages that exceed retry limits.
   */
  it('should send messages to dead letter queue after max retries', async () => {
    // Create test event
    const testEvent = createTestEvent('DLQ_TEST', { value: 'dlq-test' });
    
    // Set up DLQ consumer
    const dlqPromise = new Promise<TestEvent>((resolve) => {
      kafkaService.consume<TestEvent>(
        TOPICS.DEAD_LETTER,
        async (message, metadata) => {
          if (message.type === 'DLQ_TEST') {
            resolve(message);
          }
        },
        {
          groupId: 'test-dlq-consumer-group',
          fromBeginning: true,
        }
      );
    });
    
    // Set up consumer that always fails
    kafkaService.consume<TestEvent>(
      TEST_ERROR_TOPIC,
      async (message) => {
        if (message.type === 'DLQ_TEST') {
          throw new Error('Simulated permanent failure');
        }
      },
      {
        groupId: 'test-error-consumer-group',
        fromBeginning: true,
        maxRetries: 2, // Only retry twice
        retryDelay: 300, // Short delay for faster test
        useDLQ: true, // Enable DLQ
      }
    );
    
    // Wait for consumers to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce message that will always fail
    await kafkaService.produce(TEST_ERROR_TOPIC, testEvent);
    
    // Wait for message to appear in DLQ
    const dlqMessage = await dlqPromise;
    
    // Verify DLQ message
    expect(dlqMessage).toBeDefined();
    expect(dlqMessage.type).toBe('DLQ_TEST');
    expect(dlqMessage.payload).toEqual(testEvent.payload);
  }, 20000);
  
  /**
   * Tests schema validation during message production and consumption.
   */
  it('should validate message schema during production and consumption', async () => {
    // Create test event
    const testEvent = createTestEvent('SCHEMA_TEST', { value: 'schema-test' });
    
    // Mock schema validation to pass
    schemaRegistry.validate.mockResolvedValueOnce(true);
    
    // Set up consumer
    const schemaPromise = new Promise<boolean>((resolve) => {
      kafkaService.consume<TestEvent>(
        TEST_TOPIC,
        async (message) => {
          if (message.type === 'SCHEMA_TEST') {
            resolve(true);
          }
        },
        {
          groupId: 'test-schema-consumer-group',
          fromBeginning: true,
        }
      );
    });
    
    // Wait for consumer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce message
    await kafkaService.produce(TEST_TOPIC, testEvent);
    
    // Wait for message to be consumed
    const result = await schemaPromise;
    
    // Verify schema validation was called
    expect(result).toBe(true);
    expect(schemaRegistry.validate).toHaveBeenCalledWith(TEST_TOPIC, expect.objectContaining({
      type: 'SCHEMA_TEST',
      payload: { value: 'schema-test' },
    }));
  }, 15000);
  
  /**
   * Tests error handling when schema validation fails.
   */
  it('should handle schema validation failures', async () => {
    // Create test event
    const testEvent = createTestEvent('INVALID_SCHEMA', { value: 'invalid-schema' });
    
    // Mock schema validation to fail
    const validationError = new Error('Schema validation failed');
    schemaRegistry.validate.mockRejectedValueOnce(validationError);
    
    // Attempt to produce message with invalid schema
    try {
      await kafkaService.produce(TEST_TOPIC, testEvent);
      fail('Should have thrown an error');
    } catch (error) {
      // Verify error type and details
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.code).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      expect(error.cause).toBe(validationError);
    }
    
    // Verify error was logged
    expect(loggerService.error).toHaveBeenCalledWith(
      expect.stringContaining('Schema validation failed'),
      expect.any(Error),
      'KafkaService'
    );
  });
  
  /**
   * Tests message serialization and deserialization.
   */
  it('should correctly serialize and deserialize complex message structures', async () => {
    // Create test event with complex structure
    const complexPayload = {
      string: 'test-string',
      number: 123.456,
      boolean: true,
      date: new Date('2023-01-01T00:00:00Z'),
      nested: {
        array: [1, 2, 3],
        object: { key: 'value' },
      },
      nullValue: null,
    };
    
    const testEvent = createTestEvent('COMPLEX_TEST', complexPayload);
    
    // Set up consumer with structure verification
    const complexPromise = new Promise<any>((resolve) => {
      kafkaService.consume<TestEvent>(
        TEST_TOPIC,
        async (message) => {
          if (message.type === 'COMPLEX_TEST') {
            resolve(message.payload);
          }
        },
        {
          groupId: 'test-complex-consumer-group',
          fromBeginning: true,
        }
      );
    });
    
    // Wait for consumer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce message with complex structure
    await kafkaService.produce(TEST_TOPIC, testEvent);
    
    // Wait for message to be consumed
    const receivedPayload = await complexPromise;
    
    // Verify complex structure was preserved
    // Note: Date objects are serialized to strings
    expect(receivedPayload).toEqual({
      ...complexPayload,
      date: complexPayload.date.toISOString(),
    });
  }, 15000);
  
  /**
   * Tests consumer group functionality with multiple consumers.
   */
  it('should distribute messages across consumer group members', async () => {
    // This test is more conceptual as we can't easily create multiple processes
    // in a unit test, but we can verify the consumer group configuration
    
    // Create test event
    const testEvent = createTestEvent('GROUP_TEST', { value: 'group-test' });
    
    // Set up consumer
    const groupPromise = new Promise<string>((resolve) => {
      kafkaService.consume<TestEvent>(
        TEST_TOPIC,
        async (message, metadata) => {
          if (message.type === 'GROUP_TEST') {
            resolve(metadata.partition.toString());
          }
        },
        {
          groupId: 'test-group-consumer-group',
          fromBeginning: true,
        }
      );
    });
    
    // Wait for consumer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Produce message
    await kafkaService.produce(TEST_TOPIC, testEvent);
    
    // Wait for message to be consumed
    const partition = await groupPromise;
    
    // Verify message was assigned to a partition
    expect(partition).toBeDefined();
    expect(parseInt(partition, 10)).toBeGreaterThanOrEqual(0);
  }, 15000);
});
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Consumer } from 'kafkajs';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

import { AbstractKafkaConsumer, KafkaConsumerOptions } from '../../../src/kafka/kafka.consumer';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { KafkaMessage } from '../../../src/kafka/kafka.interfaces';
import { 
  CircuitBreaker, 
  CircuitBreakerState,
  DeadLetterQueue, 
  KafkaConsumerError, 
  KafkaDeserializationError 
} from '../../../src/kafka/kafka.errors';

/**
 * Test DTO class for message validation
 */
class TestMessageDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  value: number;
}

/**
 * Concrete implementation of AbstractKafkaConsumer for testing
 */
class TestKafkaConsumer extends AbstractKafkaConsumer {
  public processedMessages: any[] = [];
  public processingErrors: Error[] = [];
  public messageTransformations: any[] = [];
  
  constructor(kafkaService: KafkaService, options: KafkaConsumerOptions) {
    super(kafkaService, options);
  }
  
  /**
   * Implementation of the abstract method to process messages
   */
  protected async processMessage(messageValue: any, originalMessage: KafkaMessage): Promise<void> {
    // Store the processed message for verification in tests
    this.processedMessages.push({ value: messageValue, original: originalMessage });
    
    // Simulate processing based on message content
    if (messageValue && messageValue.shouldFail) {
      throw new Error('Simulated processing error');
    }
    
    // Simulate processing delay if specified
    if (messageValue && messageValue.processingDelayMs) {
      await new Promise(resolve => setTimeout(resolve, messageValue.processingDelayMs));
    }
  }
  
  /**
   * Override to provide DTO class for validation
   */
  protected getMessageDtoClass(message: any): any {
    // Return TestMessageDto for messages that should be validated
    if (message && message.shouldValidate) {
      return TestMessageDto;
    }
    return undefined;
  }
  
  /**
   * Override to transform messages before processing
   */
  protected async transformMessage(message: any): Promise<any> {
    // Store the original message for verification in tests
    this.messageTransformations.push(message);
    
    // Apply transformation if specified
    if (message && message.shouldTransform) {
      return {
        ...message,
        transformed: true,
        timestamp: Date.now()
      };
    }
    
    return message;
  }
  
  /**
   * Override to handle message errors
   */
  protected async handleMessageError(error: Error, message: KafkaMessage): Promise<void> {
    // Store the error for verification in tests
    this.processingErrors.push(error);
    
    // Call the parent implementation
    await super.handleMessageError(error, message);
  }
  
  // Expose protected methods for testing
  public async testHandleMessage(message: KafkaMessage): Promise<void> {
    return this.handleMessage(message);
  }
  
  public async testHandleBatch(batch: any): Promise<void> {
    return this.handleBatch(batch);
  }
  
  public async testValidateMessage(message: any): Promise<{ isValid: boolean; errors: string[] }> {
    return this.validateMessage(message);
  }
  
  public testDeserializeMessage(message: any): any {
    return this.deserializeMessage(message);
  }
  
  public testDeserializeHeaders(headers: any): any {
    return this.deserializeHeaders(headers);
  }
  
  public async testSendToDeadLetterQueue(error: Error, message: KafkaMessage): Promise<void> {
    return this.sendToDeadLetterQueue(error, message);
  }
}

/**
 * Mock implementation of KafkaService for testing
 */
class MockKafkaService {
  private mockConsumer: Partial<Consumer>;
  private mockProducer: any = {
    send: jest.fn().mockResolvedValue({}),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
  private sentMessages: any[] = [];
  
  constructor() {
    this.mockConsumer = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockImplementation(({ eachMessage, eachBatch }) => {
        // Store the handlers for later use in tests
        this.messageHandler = eachMessage;
        this.batchHandler = eachBatch;
        return Promise.resolve();
      }),
      pause: jest.fn(),
      resume: jest.fn(),
      seek: jest.fn().mockResolvedValue(undefined),
      commitOffsets: jest.fn().mockResolvedValue(undefined),
      connected: true,
    };
  }
  
  // Message handler stored from consumer.run()
  public messageHandler: any;
  public batchHandler: any;
  
  // Methods to simulate message reception
  public async simulateMessage(topic: string, partition: number, message: any, key?: string, headers?: any): Promise<void> {
    if (!this.messageHandler) {
      throw new Error('Consumer not running');
    }
    
    await this.messageHandler({
      topic,
      partition,
      message: {
        key: key ? Buffer.from(key) : null,
        value: Buffer.from(JSON.stringify(message)),
        headers: headers || {},
        offset: '0',
        timestamp: Date.now().toString(),
      },
    });
  }
  
  public async simulateBatch(topic: string, partition: number, messages: any[]): Promise<void> {
    if (!this.batchHandler) {
      throw new Error('Consumer not running');
    }
    
    const kafkaMessages = messages.map((msg, index) => ({
      key: msg.key ? Buffer.from(msg.key) : null,
      value: Buffer.from(JSON.stringify(msg.value)),
      headers: msg.headers || {},
      offset: index.toString(),
      timestamp: Date.now().toString(),
    }));
    
    await this.batchHandler({
      batch: {
        topic,
        partition,
        messages: kafkaMessages,
      },
      resolveOffset: jest.fn(),
      heartbeat: jest.fn().mockResolvedValue(undefined),
      isRunning: jest.fn().mockReturnValue(true),
      isStale: jest.fn().mockReturnValue(false),
    });
  }
  
  // Mock methods for KafkaService
  public getConsumer(): any {
    return this.mockConsumer;
  }
  
  public getProducer(): any {
    return this.mockProducer;
  }
  
  public async send(payload: any): Promise<any> {
    this.sentMessages.push(payload);
    return this.mockProducer.send(payload);
  }
  
  // Helper methods for tests
  public getSentMessages(): any[] {
    return this.sentMessages;
  }
  
  public clearSentMessages(): void {
    this.sentMessages = [];
  }
}

// Mock CircuitBreaker and DeadLetterQueue
jest.mock('../../../src/kafka/kafka.errors', () => {
  const original = jest.requireActual('../../../src/kafka/kafka.errors');
  
  return {
    ...original,
    CircuitBreaker: jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockImplementation((fn) => fn()),
      getState: jest.fn().mockReturnValue('CLOSED'),
      dispose: jest.fn(),
    })),
    DeadLetterQueue: jest.fn().mockImplementation(() => ({
      prepareMessage: jest.fn().mockImplementation((message, error) => ({
        value: message.value,
        headers: {
          'error-message': error.message,
          'original-topic': message.topic,
          'retry-count': '1',
        },
      })),
      getTopic: jest.fn().mockReturnValue('dead-letter-queue'),
    })),
  };
});

// Mock Logger to prevent console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  };
});

describe('AbstractKafkaConsumer', () => {
  let consumer: TestKafkaConsumer;
  let kafkaService: MockKafkaService;
  let module: TestingModule;
  
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock KafkaService
    kafkaService = new MockKafkaService();
    
    // Create the testing module
    module = await Test.createTestingModule({
      providers: [
        {
          provide: KafkaService,
          useValue: kafkaService,
        },
      ],
    }).compile();
    
    // Create the consumer with default options
    consumer = new TestKafkaConsumer(kafkaService as unknown as KafkaService, {
      groupId: 'test-group',
      topics: ['test-topic'],
      fromBeginning: true,
      enableDeadLetterQueue: true,
      enableCircuitBreaker: true,
      deadLetterQueueOptions: {
        topic: 'dead-letter-queue',
        maxRetries: 3,
      },
    });
  });
  
  afterEach(async () => {
    // Clean up
    await module.close();
  });
  
  describe('Initialization', () => {
    it('should initialize with the provided options', () => {
      expect(consumer).toBeDefined();
      expect(kafkaService.getConsumer().connect).toHaveBeenCalled();
    });
    
    it('should connect to Kafka and subscribe to topics on module init', async () => {
      await consumer.onModuleInit();
      
      expect(kafkaService.getConsumer().connect).toHaveBeenCalled();
      expect(kafkaService.getConsumer().subscribe).toHaveBeenCalledWith({
        topics: ['test-topic'],
        fromBeginning: true,
      });
      expect(kafkaService.getConsumer().run).toHaveBeenCalled();
    });
    
    it('should disconnect from Kafka on module destroy', async () => {
      await consumer.onModuleDestroy();
      
      expect(kafkaService.getConsumer().disconnect).toHaveBeenCalled();
    });
  });
  
  describe('Message Handling', () => {
    it('should process valid messages', async () => {
      const message = {
        id: '123',
        name: 'Test Message',
        value: 42,
      };
      
      await kafkaService.simulateMessage('test-topic', 0, message, 'test-key');
      
      expect(consumer.processedMessages.length).toBe(1);
      expect(consumer.processedMessages[0].value).toEqual(message);
      expect(consumer.processedMessages[0].original.topic).toBe('test-topic');
      expect(consumer.processedMessages[0].original.key).toBe('test-key');
    });
    
    it('should handle message processing errors', async () => {
      const message = {
        id: '123',
        name: 'Test Message',
        value: 42,
        shouldFail: true,
      };
      
      await kafkaService.simulateMessage('test-topic', 0, message);
      
      expect(consumer.processingErrors.length).toBe(1);
      expect(consumer.processingErrors[0].message).toBe('Simulated processing error');
      expect(consumer.messagesFailed).toBe(1);
    });
    
    it('should transform messages before processing', async () => {
      const message = {
        id: '123',
        name: 'Test Message',
        value: 42,
        shouldTransform: true,
      };
      
      await kafkaService.simulateMessage('test-topic', 0, message);
      
      expect(consumer.messageTransformations.length).toBe(1);
      expect(consumer.messageTransformations[0]).toEqual(message);
      expect(consumer.processedMessages[0].value.transformed).toBe(true);
    });
    
    it('should handle batch processing', async () => {
      const messages = [
        { value: { id: '1', name: 'Message 1', value: 1 } },
        { value: { id: '2', name: 'Message 2', value: 2 } },
        { value: { id: '3', name: 'Message 3', value: 3 } },
      ];
      
      await kafkaService.simulateBatch('test-topic', 0, messages);
      
      expect(consumer.processedMessages.length).toBe(3);
      expect(consumer.processedMessages[0].value.id).toBe('1');
      expect(consumer.processedMessages[1].value.id).toBe('2');
      expect(consumer.processedMessages[2].value.id).toBe('3');
    });
  });
  
  describe('Message Validation', () => {
    it('should validate messages with DTO class', async () => {
      const validMessage = {
        id: '123',
        name: 'Valid Message',
        value: 42,
        shouldValidate: true,
      };
      
      const result = await consumer.testValidateMessage(validMessage);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    it('should reject invalid messages', async () => {
      const invalidMessage = {
        id: '123',
        // Missing required 'name' field
        value: 'not a number', // Wrong type for 'value'
        shouldValidate: true,
      };
      
      const result = await consumer.testValidateMessage(invalidMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should handle validation errors during message processing', async () => {
      const invalidMessage = {
        id: '123',
        // Missing required 'name' field
        value: 'not a number', // Wrong type for 'value'
        shouldValidate: true,
      };
      
      await kafkaService.simulateMessage('test-topic', 0, invalidMessage);
      
      expect(consumer.processingErrors.length).toBe(1);
      expect(consumer.processingErrors[0]).toBeInstanceOf(KafkaDeserializationError);
      expect(consumer.messagesFailed).toBe(1);
    });
  });
  
  describe('Error Handling and Recovery', () => {
    it('should send failed messages to dead letter queue', async () => {
      const message = {
        id: '123',
        name: 'Test Message',
        value: 42,
        shouldFail: true,
      };
      
      await kafkaService.simulateMessage('test-topic', 0, message);
      
      // Check if message was sent to DLQ
      const sentMessages = kafkaService.getSentMessages();
      expect(sentMessages.length).toBe(1);
      expect(sentMessages[0].topic).toBe('dead-letter-queue');
      expect(consumer.messagesSentToDLQ).toBe(1);
    });
    
    it('should handle circuit breaker state changes', () => {
      // Get the mock CircuitBreaker instance
      const circuitBreakerMock = require('../../../src/kafka/kafka.errors').CircuitBreaker.mock.instances[0];
      
      // Simulate circuit breaker state change callback
      const stateChangeCallback = CircuitBreaker.mock.calls[0][0].onStateChange;
      
      // Call the callback with state change from CLOSED to OPEN
      stateChangeCallback(CircuitBreakerState.CLOSED, CircuitBreakerState.OPEN);
      
      // Verify logger was called (implementation is mocked)
      expect(Logger).toHaveBeenCalled();
    });
    
    it('should pause and resume consumption', () => {
      // Add topic to subscribed topics
      (consumer as any).subscribedTopics.add('test-topic');
      
      // Pause consumption
      consumer.pause(['test-topic']);
      
      // Verify consumer.pause was called
      expect(kafkaService.getConsumer().pause).toHaveBeenCalledWith([{ topic: 'test-topic' }]);
      expect((consumer as any).pausedTopics.has('test-topic')).toBe(true);
      
      // Resume consumption
      consumer.resume(['test-topic']);
      
      // Verify consumer.resume was called
      expect(kafkaService.getConsumer().resume).toHaveBeenCalledWith([{ topic: 'test-topic' }]);
      expect((consumer as any).pausedTopics.has('test-topic')).toBe(false);
    });
    
    it('should commit offsets', async () => {
      await consumer.commitOffsets();
      
      expect(kafkaService.getConsumer().commitOffsets).toHaveBeenCalled();
    });
    
    it('should seek to specific offset', async () => {
      await consumer.seek('test-topic', 0, 100);
      
      expect(kafkaService.getConsumer().seek).toHaveBeenCalledWith({
        topic: 'test-topic',
        partition: 0,
        offset: '100',
      });
    });
  });
  
  describe('Health Reporting', () => {
    it('should report health status', () => {
      const health = consumer.getHealth();
      
      expect(health).toBeDefined();
      expect(health.isConnected).toBe(true);
      expect(health.groupId).toBe('test-group');
      expect(health.messagesProcessed).toBe(0);
      expect(health.messagesFailed).toBe(0);
      expect(health.messagesSentToDLQ).toBe(0);
    });
    
    it('should update health metrics after processing messages', async () => {
      // Process a successful message
      await kafkaService.simulateMessage('test-topic', 0, { id: '1', name: 'Success', value: 1 });
      
      // Process a failing message
      await kafkaService.simulateMessage('test-topic', 0, { id: '2', name: 'Failure', value: 2, shouldFail: true });
      
      const health = consumer.getHealth();
      
      expect(health.messagesProcessed).toBe(1); // One successful message
      expect(health.messagesFailed).toBe(1);    // One failed message
      expect(health.messagesSentToDLQ).toBe(1); // One message sent to DLQ
    });
  });
  
  describe('Serialization and Deserialization', () => {
    it('should deserialize message values', () => {
      const rawMessage = {
        value: Buffer.from(JSON.stringify({ test: 'value' })),
      };
      
      const deserialized = consumer.testDeserializeMessage(rawMessage);
      
      expect(deserialized).toEqual({ test: 'value' });
    });
    
    it('should handle non-JSON message values', () => {
      const rawMessage = {
        value: Buffer.from('not-json'),
      };
      
      const deserialized = consumer.testDeserializeMessage(rawMessage);
      
      expect(deserialized).toBe('not-json');
    });
    
    it('should deserialize message headers', () => {
      const headers = {
        'test-header': Buffer.from('test-value'),
        'another-header': Buffer.from('another-value'),
      };
      
      const deserialized = consumer.testDeserializeHeaders(headers);
      
      expect(deserialized).toEqual({
        'test-header': 'test-value',
        'another-header': 'another-value',
      });
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, IsUUID, IsDateString, IsObject, validate } from 'class-validator';

import { KafkaConsumer, KafkaConsumerOptions } from '../../../src/kafka/kafka.consumer';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { IKafkaConsumer, IKafkaMessage, IKafkaHeaders } from '../../../src/kafka/kafka.interfaces';
import { 
  KafkaError, 
  KafkaConsumerError, 
  KafkaMessageDeserializationError,
  CircuitState,
  createKafkaError
} from '../../../src/kafka/kafka.errors';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { KAFKA_DLQ_TOPIC_PREFIX } from '../../../src/kafka/kafka.constants';

// Mock implementation of BaseEvent for testing
class TestEvent implements BaseEvent {
  @IsUUID()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDateString()
  timestamp: string;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  userId?: string;

  @IsObject()
  payload: any;

  constructor(partial: Partial<TestEvent>) {
    Object.assign(this, partial);
  }
}

// Mock implementation of KafkaConsumer for testing
class TestKafkaConsumer extends KafkaConsumer<TestEvent> {
  public messageHandled = false;
  public lastHandledMessage: TestEvent | null = null;
  public lastHandledKey: string | Buffer | null = null;
  public lastHandledHeaders: IKafkaHeaders | null = null;
  public batchHandled = false;
  public lastHandledBatch: TestEvent[] | null = null;
  public errorThrown = false;
  public customTransform = false;

  constructor(kafkaService: KafkaService, options: KafkaConsumerOptions) {
    super(kafkaService, options);
  }

  // Override to expose for testing
  public async processMessage(message: IKafkaMessage<any>): Promise<void> {
    return super.processMessage(message);
  }

  // Override to expose for testing
  public async processBatch(messages: IKafkaMessage<any>[]): Promise<void> {
    return super.processBatch(messages);
  }

  // Override to expose for testing
  public async validateMessage(message: any): Promise<void> {
    return super.validateMessage(message);
  }

  // Override to expose for testing
  public getRetryCount(headers?: IKafkaHeaders): number {
    return super.getRetryCount(headers);
  }

  // Override to expose for testing
  public async handleFailedMessage(message: IKafkaMessage<any>, error: KafkaError): Promise<void> {
    return super.handleFailedMessage(message, error);
  }

  // Override to expose for testing
  public async sendToDlq(message: IKafkaMessage<any>, error: KafkaError, retryCount: number): Promise<void> {
    return super.sendToDlq(message, error, retryCount);
  }

  // Implementation of abstract method
  protected async handleMessage(message: TestEvent, key?: string | Buffer, headers?: IKafkaHeaders): Promise<void> {
    this.messageHandled = true;
    this.lastHandledMessage = message;
    this.lastHandledKey = key || null;
    this.lastHandledHeaders = headers || null;

    if (message.type === 'ERROR_EVENT') {
      this.errorThrown = true;
      throw new Error('Test error in handleMessage');
    }
  }

  // Override batch handling for testing
  protected async handleBatch(messages: TestEvent[]): Promise<void> {
    this.batchHandled = true;
    this.lastHandledBatch = messages;

    if (messages.some(msg => msg.type === 'ERROR_EVENT')) {
      this.errorThrown = true;
      throw new Error('Test error in handleBatch');
    }

    // If not using custom implementation, call the parent method
    if (!this.customTransform) {
      return super.handleBatch(messages);
    }
  }

  // Override for testing custom transformation
  protected async transformMessage(message: any, headers?: IKafkaHeaders): Promise<TestEvent> {
    if (this.customTransform) {
      // Add a custom field to demonstrate transformation
      return {
        ...message,
        transformed: true
      } as TestEvent;
    }
    return super.transformMessage(message, headers);
  }

  // Override for testing DTO validation
  protected getMessageDtoClass(message: any): any {
    if (message && message.type) {
      return TestEvent;
    }
    return null;
  }
}

// Mock KafkaService
class MockKafkaService {
  private mockConsumer: Partial<IKafkaConsumer> = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
  };

  private mockProducer = {
    send: jest.fn().mockResolvedValue({ topic: 'test-topic', partition: 0 }),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
  };

  getConsumer() {
    return this.mockConsumer;
  }

  getProducer() {
    return this.mockProducer;
  }

  // Helper to set up the consume mock to return specific messages
  setupConsumeMessages(messages: IKafkaMessage<any>[] | Error) {
    if (messages instanceof Error) {
      this.mockConsumer.consume = jest.fn().mockReturnValue(
        throwError(() => messages)
      );
    } else if (Array.isArray(messages)) {
      this.mockConsumer.consume = jest.fn().mockReturnValue(
        of(messages.length === 1 ? messages[0] : messages)
      );
    }
  }
}

describe('KafkaConsumer', () => {
  let consumer: TestKafkaConsumer;
  let kafkaService: MockKafkaService;
  let module: TestingModule;
  
  // Valid test event
  const validEvent: TestEvent = {
    eventId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'TEST_EVENT',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test-service',
    userId: 'test-user',
    payload: { test: 'data' }
  };

  // Invalid test event (missing required fields)
  const invalidEvent: Partial<TestEvent> = {
    eventId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'INVALID_EVENT',
    // Missing timestamp
    // Missing version
    source: 'test-service',
    payload: { test: 'data' }
  };

  // Error-triggering event
  const errorEvent: TestEvent = {
    ...validEvent,
    eventId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'ERROR_EVENT'
  };

  beforeEach(async () => {
    // Create a fresh mock for each test
    kafkaService = new MockKafkaService();
    
    // Create the testing module
    module = await Test.createTestingModule({
      providers: [
        {
          provide: KafkaService,
          useValue: kafkaService
        }
      ],
    }).compile();

    // Spy on console methods to prevent noise in test output
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    // Create consumer with default options
    consumer = new TestKafkaConsumer(kafkaService as unknown as KafkaService, {
      topics: ['test-topic'],
      groupId: 'test-group',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization and Lifecycle', () => {
    it('should initialize and connect to Kafka on module init', async () => {
      // Act
      await consumer.onModuleInit();

      // Assert
      expect(kafkaService.getConsumer().connect).toHaveBeenCalled();
      expect(kafkaService.getConsumer().subscribe).toHaveBeenCalledWith(['test-topic']);
      expect(consumer['isInitialized']).toBe(true);
    });

    it('should disconnect from Kafka on module destroy', async () => {
      // Arrange
      await consumer.onModuleInit();

      // Act
      await consumer.onModuleDestroy();

      // Assert
      expect(kafkaService.getConsumer().disconnect).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      // Arrange
      const connectError = new Error('Connection failed');
      jest.spyOn(kafkaService.getConsumer(), 'connect').mockRejectedValueOnce(connectError);

      // Act & Assert
      await expect(consumer.onModuleInit()).rejects.toThrow();
      expect(consumer['isInitialized']).toBe(false);
    });

    it('should not attempt to disconnect if not initialized', async () => {
      // Act
      await consumer.onModuleDestroy();

      // Assert
      expect(kafkaService.getConsumer().disconnect).not.toHaveBeenCalled();
    });
  });

  describe('Message Processing', () => {
    it('should process a valid message successfully', async () => {
      // Arrange
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        key: 'test-key',
        value: validEvent,
        headers: { 'test-header': 'test-value' }
      };

      // Act
      await consumer.processMessage(message);

      // Assert
      expect(consumer.messageHandled).toBe(true);
      expect(consumer.lastHandledMessage).toEqual(validEvent);
      expect(consumer.lastHandledKey).toBe('test-key');
      expect(consumer.lastHandledHeaders).toEqual({ 'test-header': 'test-value' });
    });

    it('should apply custom transformation if implemented', async () => {
      // Arrange
      consumer.customTransform = true;
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        value: validEvent
      };

      // Act
      await consumer.processMessage(message);

      // Assert
      expect(consumer.messageHandled).toBe(true);
      expect(consumer.lastHandledMessage).toHaveProperty('transformed', true);
    });

    it('should handle errors during message processing', async () => {
      // Arrange
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        value: errorEvent
      };
      jest.spyOn(consumer, 'handleFailedMessage').mockResolvedValueOnce();

      // Act
      await consumer.processMessage(message);

      // Assert
      expect(consumer.errorThrown).toBe(true);
      expect(consumer.handleFailedMessage).toHaveBeenCalled();
    });

    it('should start consuming messages on initialization', async () => {
      // Arrange
      const consumeSpy = jest.spyOn(consumer as any, 'startConsuming');
      
      // Act
      await consumer.onModuleInit();
      
      // Assert
      expect(consumeSpy).toHaveBeenCalled();
    });

    it('should not process messages when paused', async () => {
      // Arrange
      await consumer.onModuleInit();
      await consumer.pause();
      consumer['isPaused'] = true; // Explicitly set paused state
      
      // Setup a message to be consumed
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        value: validEvent
      };
      
      // Act
      await consumer.processMessage(message);
      
      // Assert
      expect(consumer.messageHandled).toBe(false);
    });
  });

  describe('Message Validation', () => {
    it('should validate messages against their DTO class', async () => {
      // Arrange
      const validateSpy = jest.spyOn(consumer, 'validateMessage');
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        value: validEvent
      };

      // Act
      await consumer.processMessage(message);

      // Assert
      expect(validateSpy).toHaveBeenCalled();
      expect(consumer.messageHandled).toBe(true);
    });

    it('should reject invalid messages that fail validation', async () => {
      // Arrange
      const message: IKafkaMessage<Partial<TestEvent>> = {
        topic: 'test-topic',
        value: invalidEvent
      };
      jest.spyOn(consumer, 'handleFailedMessage').mockResolvedValueOnce();

      // Act & Assert
      await consumer.processMessage(message);
      expect(consumer.handleFailedMessage).toHaveBeenCalled();
      expect(consumer.messageHandled).toBe(false);
    });

    it('should skip validation if no DTO class is provided', async () => {
      // Arrange
      jest.spyOn(consumer, 'getMessageDtoClass').mockReturnValueOnce(null);
      const validateSpy = jest.spyOn(consumer, 'validateMessage');
      const message: IKafkaMessage<any> = {
        topic: 'test-topic',
        value: { someField: 'value' } // Not a valid TestEvent
      };

      // Act
      await consumer.processMessage(message);

      // Assert
      expect(validateSpy).toHaveBeenCalled();
      expect(consumer.messageHandled).toBe(true); // Should still be processed
    });

    it('should throw an error for null or undefined messages', async () => {
      // Act & Assert
      await expect(consumer.validateMessage(null)).rejects.toThrow();
      await expect(consumer.validateMessage(undefined)).rejects.toThrow();
    });
  });

  describe('Error Handling and DLQ', () => {
    it('should retry retryable errors', async () => {
      // Arrange
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        value: errorEvent
      };
      const retryMessageSpy = jest.spyOn(consumer as any, 'retryMessage').mockResolvedValueOnce();
      
      // Act
      await consumer.handleFailedMessage(message, new KafkaConsumerError('Test error', { retryable: true }));
      
      // Assert
      expect(retryMessageSpy).toHaveBeenCalled();
    });

    it('should send to DLQ after max retries', async () => {
      // Arrange
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        value: errorEvent,
        headers: { 'retry-count': Buffer.from(consumer['options'].maxRetryAttempts!.toString()) }
      };
      const sendToDlqSpy = jest.spyOn(consumer, 'sendToDlq').mockResolvedValueOnce();
      
      // Act
      await consumer.handleFailedMessage(message, new KafkaConsumerError('Test error', { retryable: true }));
      
      // Assert
      expect(sendToDlqSpy).toHaveBeenCalled();
    });

    it('should send non-retryable errors directly to DLQ', async () => {
      // Arrange
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        value: errorEvent
      };
      const sendToDlqSpy = jest.spyOn(consumer, 'sendToDlq').mockResolvedValueOnce();
      
      // Act
      await consumer.handleFailedMessage(message, new KafkaMessageDeserializationError('Test error'));
      
      // Assert
      expect(sendToDlqSpy).toHaveBeenCalled();
    });

    it('should correctly format DLQ messages with error information', async () => {
      // Arrange
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        key: 'test-key',
        value: errorEvent
      };
      const error = new KafkaConsumerError('Test error');
      const producerSendSpy = jest.spyOn(kafkaService.getProducer(), 'send');
      
      // Act
      await consumer.sendToDlq(message, error, 2);
      
      // Assert
      expect(producerSendSpy).toHaveBeenCalledWith(expect.objectContaining({
        topic: `${KAFKA_DLQ_TOPIC_PREFIX}test-topic`,
        key: 'test-key',
        value: errorEvent,
        headers: expect.objectContaining({
          'error-message': Buffer.from('Test error'),
          'error-type': Buffer.from('KafkaConsumerError'),
          'original-topic': Buffer.from('test-topic'),
          'retry-count': Buffer.from('2')
        })
      }));
    });

    it('should handle errors during DLQ sending', async () => {
      // Arrange
      const message: IKafkaMessage<TestEvent> = {
        topic: 'test-topic',
        value: errorEvent
      };
      const error = new KafkaConsumerError('Test error');
      jest.spyOn(kafkaService.getProducer(), 'send').mockRejectedValueOnce(new Error('DLQ error'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      
      // Act
      await consumer.sendToDlq(message, error, 1);
      
      // Assert
      expect(loggerSpy).toHaveBeenCalled();
      // Should not throw
    });

    it('should correctly extract retry count from headers', () => {
      // Test with valid retry count
      expect(consumer.getRetryCount({ 'retry-count': Buffer.from('2') })).toBe(2);
      
      // Test with invalid retry count
      expect(consumer.getRetryCount({ 'retry-count': Buffer.from('invalid') })).toBe(0);
      
      // Test with missing retry count
      expect(consumer.getRetryCount({})).toBe(0);
      expect(consumer.getRetryCount()).toBe(0);
    });
  });

  describe('Batch Processing', () => {
    it('should process a batch of messages', async () => {
      // Arrange
      consumer['options'].enableBatchProcessing = true;
      const messages: IKafkaMessage<TestEvent>[] = [
        { topic: 'test-topic', value: { ...validEvent, eventId: '1' } as TestEvent },
        { topic: 'test-topic', value: { ...validEvent, eventId: '2' } as TestEvent },
        { topic: 'test-topic', value: { ...validEvent, eventId: '3' } as TestEvent }
      ];
      
      // Act
      await consumer.processBatch(messages);
      
      // Assert
      expect(consumer.batchHandled).toBe(true);
      expect(consumer.lastHandledBatch).toHaveLength(3);
    });

    it('should handle errors during batch processing', async () => {
      // Arrange
      consumer['options'].enableBatchProcessing = true;
      const messages: IKafkaMessage<TestEvent>[] = [
        { topic: 'test-topic', value: { ...validEvent, eventId: '1' } as TestEvent },
        { topic: 'test-topic', value: { ...errorEvent, eventId: '2' } as TestEvent }, // This will cause an error
        { topic: 'test-topic', value: { ...validEvent, eventId: '3' } as TestEvent }
      ];
      jest.spyOn(consumer, 'handleFailedBatch').mockResolvedValueOnce();
      
      // Act
      await consumer.processBatch(messages);
      
      // Assert
      expect(consumer.errorThrown).toBe(true);
      expect(consumer.handleFailedBatch).toHaveBeenCalled();
    });

    it('should validate all messages in a batch', async () => {
      // Arrange
      consumer['options'].enableBatchProcessing = true;
      const validateSpy = jest.spyOn(consumer, 'validateMessage');
      const messages: IKafkaMessage<TestEvent>[] = [
        { topic: 'test-topic', value: { ...validEvent, eventId: '1' } as TestEvent },
        { topic: 'test-topic', value: { ...validEvent, eventId: '2' } as TestEvent }
      ];
      
      // Act
      await consumer.processBatch(messages);
      
      // Assert
      expect(validateSpy).toHaveBeenCalledTimes(2);
    });

    it('should process each message individually if batch processing is disabled', async () => {
      // Arrange
      consumer['options'].enableBatchProcessing = false;
      const processMessageSpy = jest.spyOn(consumer, 'processMessage').mockResolvedValue();
      const messages: IKafkaMessage<TestEvent>[] = [
        { topic: 'test-topic', value: { ...validEvent, eventId: '1' } as TestEvent },
        { topic: 'test-topic', value: { ...validEvent, eventId: '2' } as TestEvent }
      ];
      
      // Mock the consumer to return a batch
      kafkaService.setupConsumeMessages(messages);
      
      // Act
      await consumer['startConsuming']();
      
      // Assert - should call processMessage for each message
      expect(processMessageSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Health Reporting', () => {
    it('should report health status correctly', () => {
      // Arrange
      consumer['messagesProcessed'] = 10;
      consumer['messagesFailed'] = 2;
      consumer['messagesSentToDlq'] = 1;
      consumer['retryAttempts'] = 3;
      consumer['processingTimes'] = [100, 200, 300];
      consumer['lastError'] = new Error('Test error');
      consumer['lastErrorTimestamp'] = new Date();
      consumer['isInitialized'] = true;
      
      // Act
      const health = consumer.getHealth();
      
      // Assert
      expect(health).toEqual(expect.objectContaining({
        isHealthy: false, // False because lastError is set
        messagesProcessed: 10,
        messagesFailed: 2,
        messagesSentToDlq: 1,
        retryAttempts: 3,
        averageProcessingTimeMs: 200, // Average of [100, 200, 300]
        lastErrorMessage: 'Test error',
        subscribedTopics: ['test-topic'],
        groupId: 'test-group',
        isConnected: true
      }));
    });

    it('should reset metrics correctly', () => {
      // Arrange
      consumer['messagesProcessed'] = 10;
      consumer['messagesFailed'] = 2;
      consumer['messagesSentToDlq'] = 1;
      consumer['retryAttempts'] = 3;
      consumer['processingTimes'] = [100, 200, 300];
      consumer['lastError'] = new Error('Test error');
      consumer['lastErrorTimestamp'] = new Date();
      
      // Act
      consumer.resetMetrics();
      
      // Assert
      expect(consumer['messagesProcessed']).toBe(0);
      expect(consumer['messagesFailed']).toBe(0);
      expect(consumer['messagesSentToDlq']).toBe(0);
      expect(consumer['retryAttempts']).toBe(0);
      expect(consumer['processingTimes']).toEqual([]);
      expect(consumer['lastError']).toBeNull();
      expect(consumer['lastErrorTimestamp']).toBeNull();
    });

    it('should report circuit breaker state if enabled', () => {
      // Arrange
      consumer['options'].enableCircuitBreaker = true;
      consumer['circuitBreaker'] = {
        getState: jest.fn().mockReturnValue(CircuitState.CLOSED)
      } as any;
      
      // Act
      const health = consumer.getHealth();
      
      // Assert
      expect(health.circuitState).toBe(CircuitState.CLOSED);
    });
  });

  describe('Pause and Resume Operations', () => {
    it('should pause consumption from topics', async () => {
      // Arrange
      await consumer.onModuleInit();
      
      // Act
      await consumer.pause();
      
      // Assert
      expect(kafkaService.getConsumer().pause).toHaveBeenCalledWith(
        [{ topic: 'test-topic', partition: 0 }]
      );
      expect(consumer['isPaused']).toBe(true);
    });

    it('should resume consumption from topics', async () => {
      // Arrange
      await consumer.onModuleInit();
      await consumer.pause(); // Pause first
      
      // Act
      await consumer.resume();
      
      // Assert
      expect(kafkaService.getConsumer().resume).toHaveBeenCalledWith(
        [{ topic: 'test-topic', partition: 0 }]
      );
      expect(consumer['isPaused']).toBe(false);
    });

    it('should throw an error when trying to pause a non-initialized consumer', async () => {
      // Act & Assert
      await expect(consumer.pause()).rejects.toThrow();
    });

    it('should throw an error when trying to resume a non-initialized consumer', async () => {
      // Act & Assert
      await expect(consumer.resume()).rejects.toThrow();
    });

    it('should allow pausing specific topics', async () => {
      // Arrange
      await consumer.onModuleInit();
      const specificTopics = ['specific-topic'];
      
      // Act
      await consumer.pause(specificTopics);
      
      // Assert
      expect(kafkaService.getConsumer().pause).toHaveBeenCalledWith(
        [{ topic: 'specific-topic', partition: 0 }]
      );
    });

    it('should handle errors during pause operation', async () => {
      // Arrange
      await consumer.onModuleInit();
      jest.spyOn(kafkaService.getConsumer(), 'pause').mockRejectedValueOnce(new Error('Pause error'));
      
      // Act & Assert
      await expect(consumer.pause()).rejects.toThrow('Pause error');
    });

    it('should handle errors during resume operation', async () => {
      // Arrange
      await consumer.onModuleInit();
      await consumer.pause(); // Pause first
      jest.spyOn(kafkaService.getConsumer(), 'resume').mockRejectedValueOnce(new Error('Resume error'));
      
      // Act & Assert
      await expect(consumer.resume()).rejects.toThrow('Resume error');
    });
  });
});
/**
 * @file kafka.interfaces.spec.ts
 * @description Unit tests for Kafka interfaces, verifying interface completeness,
 * compatibility, and integration with dependency injection.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import {
  IKafkaConfig,
  IKafkaConsumerOptions,
  IKafkaDeadLetterQueueConfig,
  IKafkaDeadLetterQueueHandler,
  IKafkaMessageHandler,
  IKafkaProducerOptions,
  IKafkaRetryHandler,
  IKafkaService,
  IValidationResult,
  IKafkaBatchProducer
} from '../../../src/kafka/kafka.interfaces';
import { EventJourney } from '../../../src/kafka/kafka.types';
// Import test utilities
import { KafkaTestClient } from '../../utils/kafka-test-client';
import { mockEventStore } from '../../mocks/mock-event-store';

// Mock the test utilities if they're not available yet
jest.mock('../../utils/kafka-test-client', () => {
  return {
    KafkaTestClient: jest.fn().mockImplementation(() => ({
      produceMessage: jest.fn().mockResolvedValue(undefined),
      consumeMessages: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

jest.mock('../../mocks/mock-event-store', () => {
  const events = {};
  return {
    mockEventStore: {
      getEvents: jest.fn((topic) => events[topic] || []),
      addEvent: jest.fn((topic, event) => {
        if (!events[topic]) {
          events[topic] = [];
        }
        events[topic].push(event);
        return event;
      }),
      clearEvents: jest.fn(() => {
        Object.keys(events).forEach(key => delete events[key]);
      })
    }
  };
});

// Mock implementations for testing
@Injectable()
class MockKafkaMessageHandler implements IKafkaMessageHandler {
  public readonly handledMessages: any[] = [];
  public readonly handledTopics: string[] = [];
  
  async handle(message: any, key?: string, headers?: Record<string, string>): Promise<void> {
    this.handledMessages.push({ message, key, headers });
  }
  
  canHandle(topic: string, message: any): boolean {
    this.handledTopics.push(topic);
    return true;
  }
}

@Injectable()
class MockKafkaRetryHandler implements IKafkaRetryHandler {
  public readonly retriedMessages: any[] = [];
  public readonly retriedTopics: string[] = [];
  
  async handleRetry(message: any, retryCount: number, originalTopic: string, key?: string, headers?: Record<string, string>): Promise<void> {
    this.retriedMessages.push({ message, retryCount, originalTopic, key, headers });
  }
  
  canHandleRetry(topic: string, message: any): boolean {
    this.retriedTopics.push(topic);
    return true;
  }
}

@Injectable()
class MockKafkaDeadLetterQueueHandler implements IKafkaDeadLetterQueueHandler {
  public readonly deadLetteredMessages: any[] = [];
  public readonly deadLetteredTopics: string[] = [];
  
  async handleDeadLetter(message: any, error: any, metadata: any): Promise<void> {
    this.deadLetteredMessages.push({ message, error, metadata });
  }
  
  canHandleDeadLetter(topic: string, message: any): boolean {
    this.deadLetteredTopics.push(topic);
    return true;
  }
}

@Injectable()
class MockKafkaService implements IKafkaService {
  public readonly producedMessages: any[] = [];
  public readonly consumedTopics: string[] = [];
  public readonly deadLetterMessages: any[] = [];
  
  async produce(topic: string, message: any, key?: string, headers?: Record<string, string>, options?: IKafkaProducerOptions): Promise<void> {
    this.producedMessages.push({ topic, message, key, headers, options });
  }
  
  async produceBatch(topic: string, messages: Array<{ value: any; key?: string; headers?: Record<string, string> }>, options?: IKafkaProducerOptions): Promise<void> {
    this.producedMessages.push(...messages.map(m => ({ topic, message: m.value, key: m.key, headers: m.headers, options })));
  }
  
  async consume(topic: string, groupId: string | undefined, callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>, options?: IKafkaConsumerOptions): Promise<void> {
    this.consumedTopics.push(topic);
    // Simulate message consumption
    await callback({ value: 'test-message' }, 'test-key', { 'test-header': 'value' });
  }
  
  async consumeRetry(originalTopic: string, groupId: string | undefined, callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>, options?: IKafkaConsumerOptions): Promise<void> {
    this.consumedTopics.push(`${originalTopic}-retry`);
    // Simulate retry message consumption
    await callback({ value: 'retry-message' }, 'retry-key', { 'retry-count': '1' });
  }
  
  async consumeDeadLetterQueue(originalTopic: string, groupId: string | undefined, callback: (message: any, error: any, metadata: any) => Promise<void>, options?: IKafkaConsumerOptions): Promise<void> {
    this.consumedTopics.push(`${originalTopic}-dlq`);
    // Simulate dead letter message consumption
    await callback({ value: 'dead-letter-message' }, new Error('Processing failed'), { retryCount: 3 });
  }
  
  async sendToDeadLetterQueue(originalTopic: string, message: any, error: Error, metadata?: Record<string, any>, config?: IKafkaDeadLetterQueueConfig): Promise<void> {
    this.deadLetterMessages.push({ originalTopic, message, error, metadata, config });
  }
}

// Journey-specific message handlers
@Injectable()
class HealthJourneyMessageHandler implements IKafkaMessageHandler {
  async handle(message: any, key?: string, headers?: Record<string, string>): Promise<void> {
    // Handle health journey specific message
  }
  
  canHandle(topic: string, message: any, headers?: Record<string, string>): boolean {
    return topic.startsWith('health.') || 
           (headers && headers['event-journey'] === EventJourney.HEALTH);
  }
}

@Injectable()
class CareJourneyMessageHandler implements IKafkaMessageHandler {
  async handle(message: any, key?: string, headers?: Record<string, string>): Promise<void> {
    // Handle care journey specific message
  }
  
  canHandle(topic: string, message: any, headers?: Record<string, string>): boolean {
    return topic.startsWith('care.') || 
           (headers && headers['event-journey'] === EventJourney.CARE);
  }
}

@Injectable()
class PlanJourneyMessageHandler implements IKafkaMessageHandler {
  async handle(message: any, key?: string, headers?: Record<string, string>): Promise<void> {
    // Handle plan journey specific message
  }
  
  canHandle(topic: string, message: any, headers?: Record<string, string>): boolean {
    return topic.startsWith('plan.') || 
           (headers && headers['event-journey'] === EventJourney.PLAN);
  }
}

// Test module for dependency injection testing
@Module({
  providers: [
    MockKafkaService,
    MockKafkaMessageHandler,
    MockKafkaRetryHandler,
    MockKafkaDeadLetterQueueHandler,
    HealthJourneyMessageHandler,
    CareJourneyMessageHandler,
    PlanJourneyMessageHandler,
    {
      provide: 'KAFKA_SERVICE',
      useClass: MockKafkaService
    },
    {
      provide: 'KAFKA_MESSAGE_HANDLER',
      useClass: MockKafkaMessageHandler
    },
    {
      provide: 'KAFKA_RETRY_HANDLER',
      useClass: MockKafkaRetryHandler
    },
    {
      provide: 'KAFKA_DLQ_HANDLER',
      useClass: MockKafkaDeadLetterQueueHandler
    },
    {
      provide: 'HEALTH_MESSAGE_HANDLER',
      useClass: HealthJourneyMessageHandler
    },
    {
      provide: 'CARE_MESSAGE_HANDLER',
      useClass: CareJourneyMessageHandler
    },
    {
      provide: 'PLAN_MESSAGE_HANDLER',
      useClass: PlanJourneyMessageHandler
    }
  ],
  exports: [
    MockKafkaService,
    MockKafkaMessageHandler,
    MockKafkaRetryHandler,
    MockKafkaDeadLetterQueueHandler,
    'KAFKA_SERVICE',
    'KAFKA_MESSAGE_HANDLER',
    'KAFKA_RETRY_HANDLER',
    'KAFKA_DLQ_HANDLER',
    'HEALTH_MESSAGE_HANDLER',
    'CARE_MESSAGE_HANDLER',
    'PLAN_MESSAGE_HANDLER'
  ]
})
class TestModule {}

describe('Kafka Interfaces', () => {
  let module: TestingModule;
  let kafkaService: MockKafkaService;
  let messageHandler: MockKafkaMessageHandler;
  let retryHandler: MockKafkaRetryHandler;
  let dlqHandler: MockKafkaDeadLetterQueueHandler;
  let healthHandler: HealthJourneyMessageHandler;
  let careHandler: CareJourneyMessageHandler;
  let planHandler: PlanJourneyMessageHandler;
  
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule]
    }).compile();
    
    kafkaService = module.get<MockKafkaService>(MockKafkaService);
    messageHandler = module.get<MockKafkaMessageHandler>(MockKafkaMessageHandler);
    retryHandler = module.get<MockKafkaRetryHandler>(MockKafkaRetryHandler);
    dlqHandler = module.get<MockKafkaDeadLetterQueueHandler>(MockKafkaDeadLetterQueueHandler);
    healthHandler = module.get<HealthJourneyMessageHandler>(HealthJourneyMessageHandler);
    careHandler = module.get<CareJourneyMessageHandler>(CareJourneyMessageHandler);
    planHandler = module.get<PlanJourneyMessageHandler>(PlanJourneyMessageHandler);
  });
  
  afterEach(async () => {
    await module.close();
  });
  
  describe('IKafkaConfig', () => {
    it('should define required properties for Kafka configuration', () => {
      const config: IKafkaConfig = {
        clientId: 'test-client',
        brokers: ['localhost:9092']
      };
      
      expect(config.clientId).toBeDefined();
      expect(config.brokers).toBeDefined();
      expect(Array.isArray(config.brokers)).toBeTruthy();
    });
    
    it('should support optional SSL configuration', () => {
      const config: IKafkaConfig = {
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        ssl: true
      };
      
      expect(config.ssl).toBeTruthy();
    });
    
    it('should support optional SASL authentication', () => {
      const config: IKafkaConfig = {
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        sasl: {
          mechanism: 'plain',
          username: 'user',
          password: 'pass'
        }
      };
      
      expect(config.sasl).toBeDefined();
      expect(config.sasl?.mechanism).toBe('plain');
      expect(config.sasl?.username).toBe('user');
      expect(config.sasl?.password).toBe('pass');
    });
    
    it('should support optional retry configuration', () => {
      const config: IKafkaConfig = {
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        retry: {
          initialRetryTime: 100,
          retries: 5
        }
      };
      
      expect(config.retry).toBeDefined();
      expect(config.retry?.initialRetryTime).toBe(100);
      expect(config.retry?.retries).toBe(5);
    });
  });
  
  describe('IValidationResult', () => {
    it('should define required properties for validation results', () => {
      const validResult: IValidationResult = {
        isValid: true
      };
      
      const invalidResult: IValidationResult = {
        isValid: false,
        error: 'Validation failed'
      };
      
      expect(validResult.isValid).toBeTruthy();
      expect(invalidResult.isValid).toBeFalsy();
      expect(invalidResult.error).toBe('Validation failed');
    });
  });
  
  describe('IKafkaDeadLetterQueueConfig', () => {
    it('should define optional properties for DLQ configuration', () => {
      const config: IKafkaDeadLetterQueueConfig = {
        enabled: true,
        topic: 'dead-letter-topic',
        retryTopic: 'retry-topic',
        retryEnabled: true,
        maxRetries: 3,
        baseBackoffMs: 1000,
        maxBackoffMs: 30000
      };
      
      expect(config.enabled).toBeTruthy();
      expect(config.topic).toBe('dead-letter-topic');
      expect(config.retryTopic).toBe('retry-topic');
      expect(config.retryEnabled).toBeTruthy();
      expect(config.maxRetries).toBe(3);
      expect(config.baseBackoffMs).toBe(1000);
      expect(config.maxBackoffMs).toBe(30000);
    });
  });
  
  describe('IKafkaProducerOptions', () => {
    it('should define optional properties for producer configuration', () => {
      const options: IKafkaProducerOptions = {
        producerId: 'test-producer',
        producerConfig: {
          allowAutoTopicCreation: true
        },
        serializer: (message: any) => Buffer.from(JSON.stringify(message)),
        validator: (message: any) => ({ isValid: true }),
        acks: 1,
        timeout: 30000
      };
      
      expect(options.producerId).toBe('test-producer');
      expect(options.producerConfig).toBeDefined();
      expect(options.serializer).toBeDefined();
      expect(options.validator).toBeDefined();
      expect(options.acks).toBe(1);
      expect(options.timeout).toBe(30000);
      
      // Test serializer function
      const message = { test: 'value' };
      const serialized = options.serializer(message);
      expect(serialized).toBeInstanceOf(Buffer);
      expect(JSON.parse(serialized.toString())).toEqual(message);
      
      // Test validator function
      const validationResult = options.validator(message);
      expect(validationResult.isValid).toBeTruthy();
    });
  });
  
  describe('IKafkaConsumerOptions', () => {
    it('should define optional properties for consumer configuration', () => {
      const options: IKafkaConsumerOptions = {
        deserializer: (buffer: Buffer) => JSON.parse(buffer.toString()),
        validator: (message: any) => ({ isValid: true }),
        deadLetterQueue: {
          enabled: true,
          topic: 'dead-letter-topic'
        },
        retry: {
          retries: 3
        },
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 1000,
        maxBytes: 1048576,
        fromBeginning: true,
        consumerRunConfig: {
          autoCommit: true
        },
        throwOriginalError: true
      };
      
      expect(options.deserializer).toBeDefined();
      expect(options.validator).toBeDefined();
      expect(options.deadLetterQueue).toBeDefined();
      expect(options.retry).toBeDefined();
      expect(options.sessionTimeout).toBe(30000);
      expect(options.heartbeatInterval).toBe(3000);
      expect(options.maxWaitTimeInMs).toBe(1000);
      expect(options.maxBytes).toBe(1048576);
      expect(options.fromBeginning).toBeTruthy();
      expect(options.consumerRunConfig).toBeDefined();
      expect(options.throwOriginalError).toBeTruthy();
      
      // Test deserializer function
      const buffer = Buffer.from(JSON.stringify({ test: 'value' }));
      const deserialized = options.deserializer(buffer);
      expect(deserialized).toEqual({ test: 'value' });
      
      // Test validator function
      const validationResult = options.validator(deserialized);
      expect(validationResult.isValid).toBeTruthy();
    });
  });
  
  describe('IKafkaMessageHandler', () => {
    it('should define required methods for message handling', async () => {
      const handler = new MockKafkaMessageHandler();
      
      // Test handle method
      const message = { test: 'value' };
      const key = 'test-key';
      const headers = { 'test-header': 'value' };
      
      await handler.handle(message, key, headers);
      
      expect(handler.handledMessages.length).toBe(1);
      expect(handler.handledMessages[0].message).toEqual(message);
      expect(handler.handledMessages[0].key).toBe(key);
      expect(handler.handledMessages[0].headers).toEqual(headers);
      
      // Test canHandle method
      const topic = 'test-topic';
      const canHandle = handler.canHandle(topic, message);
      
      expect(canHandle).toBeTruthy();
      expect(handler.handledTopics).toContain(topic);
    });
    
    it('should be injectable via NestJS dependency injection', () => {
      const injectedHandler = module.get<MockKafkaMessageHandler>('KAFKA_MESSAGE_HANDLER');
      
      expect(injectedHandler).toBeInstanceOf(MockKafkaMessageHandler);
    });
  });
  
  describe('IKafkaRetryHandler', () => {
    it('should define required methods for retry handling', async () => {
      const handler = new MockKafkaRetryHandler();
      
      // Test handleRetry method
      const message = { test: 'value' };
      const retryCount = 2;
      const originalTopic = 'original-topic';
      const key = 'test-key';
      const headers = { 'test-header': 'value' };
      
      await handler.handleRetry(message, retryCount, originalTopic, key, headers);
      
      expect(handler.retriedMessages.length).toBe(1);
      expect(handler.retriedMessages[0].message).toEqual(message);
      expect(handler.retriedMessages[0].retryCount).toBe(retryCount);
      expect(handler.retriedMessages[0].originalTopic).toBe(originalTopic);
      expect(handler.retriedMessages[0].key).toBe(key);
      expect(handler.retriedMessages[0].headers).toEqual(headers);
      
      // Test canHandleRetry method
      const topic = 'test-topic';
      const canHandleRetry = handler.canHandleRetry(topic, message);
      
      expect(canHandleRetry).toBeTruthy();
      expect(handler.retriedTopics).toContain(topic);
    });
    
    it('should be injectable via NestJS dependency injection', () => {
      const injectedHandler = module.get<MockKafkaRetryHandler>('KAFKA_RETRY_HANDLER');
      
      expect(injectedHandler).toBeInstanceOf(MockKafkaRetryHandler);
    });
  });
  
  describe('IKafkaDeadLetterQueueHandler', () => {
    it('should define required methods for dead letter queue handling', async () => {
      const handler = new MockKafkaDeadLetterQueueHandler();
      
      // Test handleDeadLetter method
      const message = { test: 'value' };
      const error = new Error('Processing failed');
      const metadata = { retryCount: 3 };
      
      await handler.handleDeadLetter(message, error, metadata);
      
      expect(handler.deadLetteredMessages.length).toBe(1);
      expect(handler.deadLetteredMessages[0].message).toEqual(message);
      expect(handler.deadLetteredMessages[0].error).toBe(error);
      expect(handler.deadLetteredMessages[0].metadata).toEqual(metadata);
      
      // Test canHandleDeadLetter method
      const topic = 'test-topic';
      const canHandleDeadLetter = handler.canHandleDeadLetter(topic, message);
      
      expect(canHandleDeadLetter).toBeTruthy();
      expect(handler.deadLetteredTopics).toContain(topic);
    });
    
    it('should be injectable via NestJS dependency injection', () => {
      const injectedHandler = module.get<MockKafkaDeadLetterQueueHandler>('KAFKA_DLQ_HANDLER');
      
      expect(injectedHandler).toBeInstanceOf(MockKafkaDeadLetterQueueHandler);
    });
  });
  
  describe('IKafkaBatchProducer', () => {
    it('should define required methods for batch message production', async () => {
      // MockKafkaService implements IKafkaBatchProducer through IKafkaService
      const batchProducer: IKafkaBatchProducer = kafkaService;
      
      const topic = 'test-topic';
      const messages = [
        { value: { id: 1, data: 'test1' }, key: 'key1', headers: { 'header1': 'value1' } },
        { value: { id: 2, data: 'test2' }, key: 'key2', headers: { 'header2': 'value2' } }
      ];
      
      await batchProducer.produceBatch(topic, messages);
      
      expect(kafkaService.producedMessages.length).toBe(2);
      expect(kafkaService.producedMessages[0].topic).toBe(topic);
      expect(kafkaService.producedMessages[0].message).toEqual(messages[0].value);
      expect(kafkaService.producedMessages[0].key).toBe(messages[0].key);
      expect(kafkaService.producedMessages[0].headers).toEqual(messages[0].headers);
      
      expect(kafkaService.producedMessages[1].topic).toBe(topic);
      expect(kafkaService.producedMessages[1].message).toEqual(messages[1].value);
      expect(kafkaService.producedMessages[1].key).toBe(messages[1].key);
      expect(kafkaService.producedMessages[1].headers).toEqual(messages[1].headers);
    });
  });
  
  describe('IKafkaService', () => {
    it('should define required methods for Kafka operations', async () => {
      const service = new MockKafkaService();
      
      // Test produce method
      const produceTopic = 'produce-topic';
      const produceMessage = { test: 'produce-value' };
      const produceKey = 'produce-key';
      const produceHeaders = { 'produce-header': 'value' };
      
      await service.produce(produceTopic, produceMessage, produceKey, produceHeaders);
      
      expect(service.producedMessages.length).toBe(1);
      expect(service.producedMessages[0].topic).toBe(produceTopic);
      expect(service.producedMessages[0].message).toEqual(produceMessage);
      expect(service.producedMessages[0].key).toBe(produceKey);
      expect(service.producedMessages[0].headers).toEqual(produceHeaders);
      
      // Test consume method
      const consumeTopic = 'consume-topic';
      const consumeGroupId = 'consume-group';
      const consumeCallback = jest.fn();
      
      await service.consume(consumeTopic, consumeGroupId, consumeCallback);
      
      expect(service.consumedTopics).toContain(consumeTopic);
      expect(consumeCallback).toHaveBeenCalledWith(
        { value: 'test-message' },
        'test-key',
        { 'test-header': 'value' }
      );
      
      // Test consumeRetry method
      const retryTopic = 'retry-topic';
      const retryGroupId = 'retry-group';
      const retryCallback = jest.fn();
      
      await service.consumeRetry(retryTopic, retryGroupId, retryCallback);
      
      expect(service.consumedTopics).toContain(`${retryTopic}-retry`);
      expect(retryCallback).toHaveBeenCalledWith(
        { value: 'retry-message' },
        'retry-key',
        { 'retry-count': '1' }
      );
      
      // Test consumeDeadLetterQueue method
      const dlqTopic = 'dlq-topic';
      const dlqGroupId = 'dlq-group';
      const dlqCallback = jest.fn();
      
      await service.consumeDeadLetterQueue(dlqTopic, dlqGroupId, dlqCallback);
      
      expect(service.consumedTopics).toContain(`${dlqTopic}-dlq`);
      expect(dlqCallback).toHaveBeenCalledWith(
        { value: 'dead-letter-message' },
        expect.any(Error),
        { retryCount: 3 }
      );
      
      // Test sendToDeadLetterQueue method
      const originalTopic = 'original-topic';
      const dlqMessage = { test: 'dlq-value' };
      const dlqError = new Error('Processing failed');
      const dlqMetadata = { retryCount: 3 };
      
      await service.sendToDeadLetterQueue(originalTopic, dlqMessage, dlqError, dlqMetadata);
      
      expect(service.deadLetterMessages.length).toBe(1);
      expect(service.deadLetterMessages[0].originalTopic).toBe(originalTopic);
      expect(service.deadLetterMessages[0].message).toEqual(dlqMessage);
      expect(service.deadLetterMessages[0].error).toBe(dlqError);
      expect(service.deadLetterMessages[0].metadata).toEqual(dlqMetadata);
    });
    
    it('should be injectable via NestJS dependency injection', () => {
      const injectedService = module.get<MockKafkaService>('KAFKA_SERVICE');
      
      expect(injectedService).toBeInstanceOf(MockKafkaService);
    });
  });
  
  describe('Journey-specific message handlers', () => {
    it('should correctly identify health journey events', () => {
      const healthTopic = 'health.metrics.recorded';
      const healthMessage = { metricType: 'HEART_RATE', value: 75 };
      const healthHeaders = { 'event-journey': EventJourney.HEALTH };
      
      expect(healthHandler.canHandle(healthTopic, healthMessage)).toBeTruthy();
      expect(healthHandler.canHandle('other-topic', healthMessage, healthHeaders)).toBeTruthy();
      expect(healthHandler.canHandle('other-topic', healthMessage)).toBeFalsy();
    });
    
    it('should correctly identify care journey events', () => {
      const careTopic = 'care.appointment.booked';
      const careMessage = { appointmentId: '123', providerId: '456' };
      const careHeaders = { 'event-journey': EventJourney.CARE };
      
      expect(careHandler.canHandle(careTopic, careMessage)).toBeTruthy();
      expect(careHandler.canHandle('other-topic', careMessage, careHeaders)).toBeTruthy();
      expect(careHandler.canHandle('other-topic', careMessage)).toBeFalsy();
    });
    
    it('should correctly identify plan journey events', () => {
      const planTopic = 'plan.claim.submitted';
      const planMessage = { claimId: '123', amount: 100 };
      const planHeaders = { 'event-journey': EventJourney.PLAN };
      
      expect(planHandler.canHandle(planTopic, planMessage)).toBeTruthy();
      expect(planHandler.canHandle('other-topic', planMessage, planHeaders)).toBeTruthy();
      expect(planHandler.canHandle('other-topic', planMessage)).toBeFalsy();
    });
    
    it('should be injectable via NestJS dependency injection', () => {
      const injectedHealthHandler = module.get<HealthJourneyMessageHandler>('HEALTH_MESSAGE_HANDLER');
      const injectedCareHandler = module.get<CareJourneyMessageHandler>('CARE_MESSAGE_HANDLER');
      const injectedPlanHandler = module.get<PlanJourneyMessageHandler>('PLAN_MESSAGE_HANDLER');
      
      expect(injectedHealthHandler).toBeInstanceOf(HealthJourneyMessageHandler);
      expect(injectedCareHandler).toBeInstanceOf(CareJourneyMessageHandler);
      expect(injectedPlanHandler).toBeInstanceOf(PlanJourneyMessageHandler);
    });
  });
  
  describe('Cross-service compatibility', () => {
    it('should allow multiple services to implement the same interfaces', () => {
      // Create mock handlers for different services
      const healthServiceHandler = new MockKafkaMessageHandler();
      const careServiceHandler = new MockKafkaMessageHandler();
      const planServiceHandler = new MockKafkaMessageHandler();
      
      // All handlers implement the same interface
      expect(healthServiceHandler).toBeInstanceOf(MockKafkaMessageHandler);
      expect(careServiceHandler).toBeInstanceOf(MockKafkaMessageHandler);
      expect(planServiceHandler).toBeInstanceOf(MockKafkaMessageHandler);
      
      // Each handler can process messages independently
      const healthMessage = { metricType: 'HEART_RATE', value: 75 };
      const careMessage = { appointmentId: '123', providerId: '456' };
      const planMessage = { claimId: '123', amount: 100 };
      
      healthServiceHandler.handle(healthMessage);
      careServiceHandler.handle(careMessage);
      planServiceHandler.handle(planMessage);
      
      expect(healthServiceHandler.handledMessages[0].message).toEqual(healthMessage);
      expect(careServiceHandler.handledMessages[0].message).toEqual(careMessage);
      expect(planServiceHandler.handledMessages[0].message).toEqual(planMessage);
    });
    
    it('should allow services to use the Kafka client with consistent interfaces', async () => {
      // Create a test client that uses the interfaces
      const testClient = new KafkaTestClient();
      
      // Test producing a message
      const topic = 'test-topic';
      const message = { test: 'value' };
      
      await testClient.produceMessage(topic, message);
      
      // Add the event to the mock store for testing
      mockEventStore.addEvent(topic, { payload: message, timestamp: new Date().toISOString() });
      
      // Verify the message was stored in the mock event store
      const storedEvents = mockEventStore.getEvents(topic);
      expect(storedEvents.length).toBeGreaterThan(0);
      expect(storedEvents[0].payload).toEqual(message);
    });
  });
});
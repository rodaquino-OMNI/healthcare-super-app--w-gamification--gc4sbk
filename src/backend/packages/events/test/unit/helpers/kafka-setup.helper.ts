import { Admin, Consumer, Kafka, Producer, ProducerRecord, RecordMetadata } from 'kafkajs';
import { Observable, Subject } from 'rxjs';
import { IKafkaConsumer, IKafkaProducer, IKafkaService } from '../../../src/kafka/kafka.interfaces';
import { KafkaMessage, KafkaMessageHandler, KafkaTopicConfig } from '../../../src/kafka/kafka.types';
import { EventType } from '../../../src/dto/event-types.enum';
import { BaseEventDto } from '../../../src/dto/base-event.dto';
import { RetryPolicy } from '../../../src/errors/retry-policies';
import { EventProcessingError } from '../../../src/errors/event-errors';
import { DLQService } from '../../../src/errors/dlq';

/**
 * Mock implementation of Kafka producer for testing
 */
export class MockKafkaProducer implements IKafkaProducer {
  private readonly sentMessages: Array<{ topic: string; messages: any[] }> = [];
  private readonly messageSubject = new Subject<{ topic: string; message: any }>();
  private connected = false;
  private shouldFail = false;
  private failureRate = 0;
  private errorType: 'network' | 'broker' | 'validation' = 'network';

  /**
   * Gets an observable of messages sent through this producer
   */
  public get messages$(): Observable<{ topic: string; message: any }> {
    return this.messageSubject.asObservable();
  }

  /**
   * Gets all messages sent through this producer
   */
  public get sentMessages(): Array<{ topic: string; messages: any[] }> {
    return this.sentMessages;
  }

  /**
   * Configures the producer to simulate failures
   * 
   * @param shouldFail - Whether the producer should fail
   * @param failureRate - Rate of failures (0-1)
   * @param errorType - Type of error to simulate
   */
  public configureFaults(shouldFail: boolean, failureRate = 1, errorType: 'network' | 'broker' | 'validation' = 'network'): void {
    this.shouldFail = shouldFail;
    this.failureRate = failureRate;
    this.errorType = errorType;
  }

  /**
   * Connects the producer
   */
  public async connect(): Promise<void> {
    this.connected = true;
  }

  /**
   * Disconnects the producer
   */
  public async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Sends a message to a topic
   * 
   * @param record - The record to send
   * @returns Promise resolving to record metadata
   */
  public async send(record: ProducerRecord): Promise<RecordMetadata[]> {
    if (!this.connected) {
      throw new Error('Producer not connected');
    }

    if (this.shouldFail && Math.random() < this.failureRate) {
      if (this.errorType === 'network') {
        throw new Error('Network error');
      } else if (this.errorType === 'broker') {
        throw new Error('Broker error');
      } else {
        throw new Error('Validation error');
      }
    }

    this.sentMessages.push({
      topic: record.topic,
      messages: record.messages,
    });

    record.messages.forEach(message => {
      this.messageSubject.next({
        topic: record.topic,
        message,
      });
    });

    return record.messages.map((_, index) => ({
      topicName: record.topic,
      partition: 0,
      errorCode: 0,
      baseOffset: String(index),
      logAppendTime: '-1',
      logStartOffset: '0',
    }));
  }
}

/**
 * Mock implementation of Kafka consumer for testing
 */
export class MockKafkaConsumer implements IKafkaConsumer {
  private handlers: Map<string, KafkaMessageHandler[]> = new Map();
  private connected = false;
  private subscribed = false;
  private running = false;
  private shouldFail = false;
  private failureRate = 0;
  private errorType: 'network' | 'processing' | 'validation' = 'network';
  private processedMessages: KafkaMessage[] = [];
  private failedMessages: KafkaMessage[] = [];
  private dlqService?: DLQService;

  /**
   * Creates a new MockKafkaConsumer
   * 
   * @param groupId - Consumer group ID
   * @param topics - Topics to subscribe to
   * @param dlqService - Optional DLQ service for handling failed messages
   */
  constructor(
    private readonly groupId: string,
    private readonly topics: string[] = [],
    dlqService?: DLQService,
  ) {
    this.dlqService = dlqService;
  }

  /**
   * Gets all processed messages
   */
  public get processedMessages(): KafkaMessage[] {
    return this.processedMessages;
  }

  /**
   * Gets all failed messages
   */
  public get failedMessages(): KafkaMessage[] {
    return this.failedMessages;
  }

  /**
   * Configures the consumer to simulate failures
   * 
   * @param shouldFail - Whether the consumer should fail
   * @param failureRate - Rate of failures (0-1)
   * @param errorType - Type of error to simulate
   */
  public configureFaults(shouldFail: boolean, failureRate = 1, errorType: 'network' | 'processing' | 'validation' = 'network'): void {
    this.shouldFail = shouldFail;
    this.failureRate = failureRate;
    this.errorType = errorType;
  }

  /**
   * Connects the consumer
   */
  public async connect(): Promise<void> {
    this.connected = true;
  }

  /**
   * Disconnects the consumer
   */
  public async disconnect(): Promise<void> {
    this.connected = false;
    this.running = false;
  }

  /**
   * Subscribes to topics
   * 
   * @param topics - Topics to subscribe to
   */
  public async subscribe(topics: string[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    this.topics.push(...topics);
    this.subscribed = true;
  }

  /**
   * Registers a message handler for a topic
   * 
   * @param topic - Topic to handle
   * @param handler - Message handler
   */
  public registerHandler(topic: string, handler: KafkaMessageHandler): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }

    this.handlers.get(topic)!.push(handler);
  }

  /**
   * Starts consuming messages
   */
  public async run(): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    if (!this.subscribed) {
      throw new Error('Consumer not subscribed to any topics');
    }

    this.running = true;
  }

  /**
   * Stops consuming messages
   */
  public async stop(): Promise<void> {
    this.running = false;
  }

  /**
   * Simulates receiving a message
   * 
   * @param topic - Topic the message is from
   * @param message - The message
   * @returns Promise resolving when message is processed
   */
  public async simulateMessage(topic: string, message: any): Promise<void> {
    if (!this.running) {
      throw new Error('Consumer not running');
    }

    if (!this.topics.includes(topic)) {
      throw new Error(`Consumer not subscribed to topic: ${topic}`);
    }

    const kafkaMessage: KafkaMessage = {
      topic,
      partition: 0,
      offset: String(this.processedMessages.length + this.failedMessages.length),
      key: message.key || null,
      value: typeof message.value === 'string' ? message.value : JSON.stringify(message.value),
      timestamp: Date.now().toString(),
      headers: message.headers || {},
    };

    try {
      if (this.shouldFail && Math.random() < this.failureRate) {
        if (this.errorType === 'network') {
          throw new Error('Network error');
        } else if (this.errorType === 'processing') {
          throw new Error('Processing error');
        } else {
          throw new Error('Validation error');
        }
      }

      const handlers = this.handlers.get(topic) || [];
      for (const handler of handlers) {
        await handler(kafkaMessage);
      }

      this.processedMessages.push(kafkaMessage);
    } catch (error) {
      this.failedMessages.push(kafkaMessage);
      
      if (this.dlqService) {
        await this.dlqService.sendToDLQ(topic, kafkaMessage, error);
      }
      
      throw error;
    }
  }
}

/**
 * Mock implementation of Kafka service for testing
 */
export class MockKafkaService implements IKafkaService {
  private producers: Map<string, MockKafkaProducer> = new Map();
  private consumers: Map<string, MockKafkaConsumer> = new Map();
  private topics: Set<string> = new Set();
  private dlqService?: DLQService;

  /**
   * Creates a new MockKafkaService
   * 
   * @param dlqService - Optional DLQ service for handling failed messages
   */
  constructor(dlqService?: DLQService) {
    this.dlqService = dlqService;
  }

  /**
   * Gets a producer by name
   * 
   * @param name - Producer name
   * @returns The producer
   */
  public getProducer(name: string): MockKafkaProducer {
    if (!this.producers.has(name)) {
      this.producers.set(name, new MockKafkaProducer());
    }

    return this.producers.get(name)!;
  }

  /**
   * Gets a consumer by group ID
   * 
   * @param groupId - Consumer group ID
   * @returns The consumer
   */
  public getConsumer(groupId: string): MockKafkaConsumer {
    if (!this.consumers.has(groupId)) {
      this.consumers.set(groupId, new MockKafkaConsumer(groupId, [], this.dlqService));
    }

    return this.consumers.get(groupId)!;
  }

  /**
   * Creates a topic
   * 
   * @param topic - Topic configuration
   */
  public async createTopic(topic: KafkaTopicConfig): Promise<void> {
    this.topics.add(topic.topic);
  }

  /**
   * Checks if a topic exists
   * 
   * @param topic - Topic name
   * @returns Whether the topic exists
   */
  public topicExists(topic: string): boolean {
    return this.topics.has(topic);
  }

  /**
   * Gets all topics
   * 
   * @returns Array of topic names
   */
  public getTopics(): string[] {
    return Array.from(this.topics);
  }

  /**
   * Connects all producers and consumers
   */
  public async connect(): Promise<void> {
    for (const producer of this.producers.values()) {
      await producer.connect();
    }

    for (const consumer of this.consumers.values()) {
      await consumer.connect();
    }
  }

  /**
   * Disconnects all producers and consumers
   */
  public async disconnect(): Promise<void> {
    for (const producer of this.producers.values()) {
      await producer.disconnect();
    }

    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
  }
}

/**
 * Mock implementation of DLQ service for testing
 */
export class MockDLQService implements DLQService {
  private dlqMessages: Map<string, KafkaMessage[]> = new Map();
  private producer: MockKafkaProducer;

  /**
   * Creates a new MockDLQService
   * 
   * @param producer - Kafka producer to use
   */
  constructor(producer: MockKafkaProducer) {
    this.producer = producer;
  }

  /**
   * Gets all messages sent to a DLQ topic
   * 
   * @param topic - DLQ topic name
   * @returns Array of messages
   */
  public getMessagesForTopic(topic: string): KafkaMessage[] {
    return this.dlqMessages.get(topic) || [];
  }

  /**
   * Gets all DLQ messages
   * 
   * @returns Map of topic to messages
   */
  public getAllMessages(): Map<string, KafkaMessage[]> {
    return this.dlqMessages;
  }

  /**
   * Sends a message to a DLQ topic
   * 
   * @param originalTopic - Original topic
   * @param message - Failed message
   * @param error - Error that caused the failure
   * @returns Promise resolving when message is sent to DLQ
   */
  public async sendToDLQ(originalTopic: string, message: KafkaMessage, error: Error): Promise<void> {
    const dlqTopic = `${originalTopic}.dlq`;
    
    if (!this.dlqMessages.has(dlqTopic)) {
      this.dlqMessages.set(dlqTopic, []);
    }

    // Add error information to headers
    const enrichedMessage = {
      ...message,
      headers: {
        ...message.headers,
        'error-message': Buffer.from(error.message),
        'error-type': Buffer.from(error.constructor.name),
        'original-topic': Buffer.from(originalTopic),
        'failure-time': Buffer.from(Date.now().toString()),
      },
    };

    this.dlqMessages.get(dlqTopic)!.push(enrichedMessage);

    // Also send to the actual DLQ topic
    await this.producer.send({
      topic: dlqTopic,
      messages: [{
        key: message.key,
        value: message.value,
        headers: enrichedMessage.headers,
      }],
    });
  }

  /**
   * Reprocesses a message from a DLQ topic
   * 
   * @param dlqTopic - DLQ topic name
   * @param message - Message to reprocess
   * @param targetTopic - Optional target topic (defaults to original topic)
   * @returns Promise resolving when message is reprocessed
   */
  public async reprocessMessage(dlqTopic: string, message: KafkaMessage, targetTopic?: string): Promise<void> {
    const originalTopic = message.headers['original-topic'] 
      ? Buffer.from(message.headers['original-topic']).toString() 
      : targetTopic;

    if (!originalTopic) {
      throw new Error('No target topic specified and original topic not found in message headers');
    }

    // Remove error headers
    const { 
      'error-message': _errorMessage, 
      'error-type': _errorType, 
      'original-topic': _originalTopic, 
      'failure-time': _failureTime, 
      ...cleanHeaders 
    } = message.headers;

    await this.producer.send({
      topic: originalTopic,
      messages: [{
        key: message.key,
        value: message.value,
        headers: cleanHeaders,
      }],
    });

    // Remove from DLQ
    const messages = this.dlqMessages.get(dlqTopic) || [];
    const index = messages.findIndex(m => m.offset === message.offset);
    if (index !== -1) {
      messages.splice(index, 1);
    }
  }
}

/**
 * Creates a test Kafka environment with mocked components
 * 
 * @returns Object containing mocked Kafka components
 */
export function createTestKafkaEnvironment() {
  const producer = new MockKafkaProducer();
  const dlqService = new MockDLQService(producer);
  const kafkaService = new MockKafkaService(dlqService);
  
  return {
    kafkaService,
    producer,
    dlqService,
    getConsumer: (groupId: string) => kafkaService.getConsumer(groupId),
  };
}

/**
 * Helper to create a test event
 * 
 * @param type - Event type
 * @param userId - User ID
 * @param journey - Journey name
 * @param data - Event data
 * @returns Base event DTO
 */
export function createTestEvent<T>(type: EventType, userId: string, journey: 'health' | 'care' | 'plan', data: T): BaseEventDto {
  return {
    eventId: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    userId,
    journey,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test',
    data,
  };
}

/**
 * Simulates a retry policy for testing
 */
export class TestRetryPolicy implements RetryPolicy {
  private attempts = 0;
  private maxRetries: number;
  private delays: number[];

  /**
   * Creates a new TestRetryPolicy
   * 
   * @param maxRetries - Maximum number of retries
   * @param delays - Array of delays in milliseconds
   */
  constructor(maxRetries = 3, delays: number[] = [100, 200, 500]) {
    this.maxRetries = maxRetries;
    this.delays = delays;
  }

  /**
   * Gets the current attempt count
   */
  public get currentAttempt(): number {
    return this.attempts;
  }

  /**
   * Checks if a retry should be attempted
   * 
   * @param error - The error that occurred
   * @returns Whether to retry
   */
  public shouldRetry(error: Error): boolean {
    return this.attempts < this.maxRetries;
  }

  /**
   * Gets the delay before the next retry
   * 
   * @returns Delay in milliseconds
   */
  public getDelay(): number {
    const delay = this.delays[this.attempts] || this.delays[this.delays.length - 1];
    this.attempts++;
    return delay;
  }

  /**
   * Resets the retry counter
   */
  public reset(): void {
    this.attempts = 0;
  }
}

/**
 * Simulates processing an event with retries
 * 
 * @param event - The event to process
 * @param processor - Function that processes the event
 * @param retryPolicy - Retry policy to use
 * @param dlqService - Optional DLQ service for failed events
 * @returns Promise resolving to processing result
 */
export async function processWithRetries<T, R>(
  event: T,
  processor: (event: T) => Promise<R>,
  retryPolicy: RetryPolicy,
  dlqService?: DLQService,
): Promise<R> {
  retryPolicy.reset();
  
  while (true) {
    try {
      return await processor(event);
    } catch (error) {
      if (retryPolicy.shouldRetry(error)) {
        const delay = retryPolicy.getDelay();
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we have a DLQ service and this is a BaseEventDto, send to DLQ
      if (dlqService && isBaseEventDto(event)) {
        const kafkaMessage = convertEventToKafkaMessage(event);
        await dlqService.sendToDLQ(
          `${(event as any).journey}.events`, 
          kafkaMessage, 
          error instanceof Error ? error : new Error(String(error))
        );
      }
      
      throw error;
    }
  }
}

/**
 * Type guard to check if an object is a BaseEventDto
 * 
 * @param obj - Object to check
 * @returns Whether the object is a BaseEventDto
 */
function isBaseEventDto(obj: any): obj is BaseEventDto {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.eventId === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.journey === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.source === 'string' &&
    obj.data !== undefined
  );
}

/**
 * Converts a BaseEventDto to a KafkaMessage
 * 
 * @param event - Event to convert
 * @returns Kafka message
 */
function convertEventToKafkaMessage(event: BaseEventDto): KafkaMessage {
  return {
    topic: `${event.journey}.events`,
    partition: 0,
    offset: '0',
    key: event.userId,
    value: JSON.stringify(event),
    timestamp: Date.now().toString(),
    headers: {
      'event-id': Buffer.from(event.eventId),
      'event-type': Buffer.from(event.type),
      'user-id': Buffer.from(event.userId),
      'journey': Buffer.from(event.journey),
      'source': Buffer.from(event.source),
      'version': Buffer.from(event.version),
    },
  };
}

/**
 * Simulates a series of events being processed through a Kafka pipeline
 * 
 * @param events - Events to process
 * @param producer - Kafka producer
 * @param consumer - Kafka consumer
 * @param handler - Message handler
 * @returns Promise resolving when all events are processed
 */
export async function simulateEventPipeline<T extends BaseEventDto>(
  events: T[],
  producer: MockKafkaProducer,
  consumer: MockKafkaConsumer,
  handler: KafkaMessageHandler,
): Promise<void> {
  // Register handler
  for (const event of events) {
    const topic = `${event.journey}.events`;
    consumer.registerHandler(topic, handler);
  }
  
  // Connect and start consumer
  await consumer.connect();
  await consumer.run();
  
  // Connect producer
  await producer.connect();
  
  // Process each event
  for (const event of events) {
    const topic = `${event.journey}.events`;
    await producer.send({
      topic,
      messages: [{
        key: event.userId,
        value: JSON.stringify(event),
        headers: {
          'event-id': Buffer.from(event.eventId),
          'event-type': Buffer.from(event.type),
          'user-id': Buffer.from(event.userId),
          'journey': Buffer.from(event.journey),
          'source': Buffer.from(event.source),
          'version': Buffer.from(event.version),
        },
      }],
    });
    
    // Simulate consumer receiving the message
    try {
      await consumer.simulateMessage(topic, {
        key: event.userId,
        value: event,
        headers: {
          'event-id': Buffer.from(event.eventId),
          'event-type': Buffer.from(event.type),
          'user-id': Buffer.from(event.userId),
          'journey': Buffer.from(event.journey),
          'source': Buffer.from(event.source),
          'version': Buffer.from(event.version),
        },
      });
    } catch (error) {
      console.error(`Error processing event ${event.eventId}:`, error);
    }
  }
  
  // Cleanup
  await consumer.stop();
  await consumer.disconnect();
  await producer.disconnect();
}

/**
 * Creates a mock event handler for testing
 * 
 * @param onSuccess - Callback for successful processing
 * @param onError - Callback for processing errors
 * @returns Message handler function
 */
export function createMockEventHandler(
  onSuccess?: (message: KafkaMessage) => void,
  onError?: (message: KafkaMessage, error: Error) => void,
): KafkaMessageHandler {
  return async (message: KafkaMessage) => {
    try {
      // Parse the message value
      const event = typeof message.value === 'string' 
        ? JSON.parse(message.value) 
        : message.value;
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      if (onSuccess) {
        onSuccess(message);
      }
    } catch (error) {
      if (onError) {
        onError(message, error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  };
}

/**
 * Creates a mock event processor that simulates errors based on configuration
 * 
 * @param config - Configuration for error simulation
 * @returns Event processor function
 */
export function createMockEventProcessor<T extends BaseEventDto, R>(config: {
  shouldFail?: boolean;
  failureRate?: number;
  errorType?: 'validation' | 'processing' | 'network';
  processingDelay?: number;
  successResult?: R;
}): (event: T) => Promise<R> {
  const {
    shouldFail = false,
    failureRate = 1,
    errorType = 'processing',
    processingDelay = 10,
    successResult = {} as R,
  } = config;
  
  return async (event: T) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, processingDelay));
    
    // Simulate failure if configured
    if (shouldFail && Math.random() < failureRate) {
      if (errorType === 'validation') {
        throw new EventProcessingError(
          'Validation failed',
          'VALIDATION_ERROR',
          event.type,
          event.eventId,
          event.journey,
        );
      } else if (errorType === 'processing') {
        throw new EventProcessingError(
          'Processing failed',
          'PROCESSING_ERROR',
          event.type,
          event.eventId,
          event.journey,
        );
      } else {
        throw new Error('Network error');
      }
    }
    
    return successResult;
  };
}
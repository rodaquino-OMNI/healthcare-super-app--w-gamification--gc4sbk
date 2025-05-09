/**
 * @file kafka.mock.ts
 * @description Mock implementation of KafkaService for testing error handling in event processing.
 * Simulates Kafka message broker behavior without requiring actual Kafka infrastructure.
 * Enables testing of error scenarios during event production and consumption.
 */

import { Injectable } from '@nestjs/common';
import { BaseError, ErrorType, ExternalError, ExternalDependencyUnavailableError, ExternalRateLimitError } from '../../src/base';
import { ERROR_CODE_PREFIXES, KAFKA_RETRY_CONFIG } from '../../src/constants';
import { JourneyContext } from '../../src/base';

/**
 * Interface for stored messages in the mock Kafka broker
 */
interface StoredMessage {
  topic: string;
  partition: number;
  offset: number;
  key?: string;
  value: any;
  headers?: Record<string, string>;
  timestamp: Date;
}

/**
 * Interface for consumer configuration
 */
interface ConsumerConfig {
  groupId: string;
  topics: Set<string>;
  fromBeginning: boolean;
  callbacks: Map<string, (message: any, key?: string, headers?: Record<string, string>) => Promise<void>>;
}

/**
 * Interface for error simulation configuration
 */
interface ErrorSimulationConfig {
  // Producer error simulation
  producerErrorRate?: number; // 0-1 probability of producer error
  producerErrorType?: 'connection' | 'rate_limit' | 'serialization' | 'unavailable';
  producerErrorTopics?: string[]; // Topics that should trigger errors
  
  // Consumer error simulation
  consumerErrorRate?: number; // 0-1 probability of consumer error
  consumerErrorType?: 'connection' | 'deserialization' | 'processing' | 'unavailable';
  consumerErrorTopics?: string[]; // Topics that should trigger errors
  
  // Specific message keys that should trigger errors
  errorKeys?: string[];
  
  // Network simulation
  networkLatencyMs?: number; // Simulated network latency in milliseconds
  networkJitterMs?: number; // Random jitter added to latency in milliseconds
  packetLossRate?: number; // 0-1 probability of packet loss
  
  // Retry behavior
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Mock implementation of KafkaService for testing.
 * Provides in-memory message storage and configurable error scenarios.
 */
@Injectable()
export class MockKafkaService {
  private messages: Map<string, StoredMessage[]> = new Map();
  private consumers: Map<string, ConsumerConfig> = new Map();
  private connected: boolean = false;
  private producerConnected: boolean = false;
  private consumerConnected: boolean = false;
  private errorConfig: ErrorSimulationConfig = {};
  private offsetCounter: Map<string, number> = new Map();
  private logger: any = {
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };
  private tracingService: any = {
    createSpan: jest.fn((name, fn) => fn())
  };

  /**
   * Creates a new MockKafkaService instance.
   * 
   * @param errorConfig - Optional configuration for error simulation
   */
  constructor(errorConfig: ErrorSimulationConfig = {}) {
    this.errorConfig = {
      producerErrorRate: 0,
      consumerErrorRate: 0,
      networkLatencyMs: 0,
      networkJitterMs: 0,
      packetLossRate: 0,
      maxRetries: KAFKA_RETRY_CONFIG.MAX_ATTEMPTS,
      retryDelayMs: KAFKA_RETRY_CONFIG.INITIAL_DELAY_MS,
      ...errorConfig
    };
  }

  /**
   * Initializes the mock Kafka service.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connectProducer();
      await this.connectConsumer();
      this.connected = true;
      this.logger.log('Mock Kafka service initialized successfully', 'MockKafkaService');
    } catch (error) {
      this.logger.error('Failed to initialize mock Kafka service', error, 'MockKafkaService');
      throw error;
    }
  }

  /**
   * Cleans up the mock Kafka service.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnectProducer();
      await this.disconnectConsumer();
      this.connected = false;
      this.logger.log('Mock Kafka service destroyed successfully', 'MockKafkaService');
    } catch (error) {
      this.logger.error('Error during mock Kafka service shutdown', error, 'MockKafkaService');
    }
  }

  /**
   * Simulates sending a message to a Kafka topic.
   * 
   * @param topic - The Kafka topic to send the message to
   * @param message - The message object to be serialized and sent
   * @param key - Optional message key for partitioning
   * @param headers - Optional message headers
   */
  async produce(
    topic: string, 
    message: any, 
    key?: string, 
    headers?: Record<string, string>
  ): Promise<void> {
    return this.tracingService.createSpan(`kafka.produce.${topic}`, async () => {
      // Simulate network latency
      await this.simulateNetworkLatency();
      
      // Check if producer is connected
      if (!this.producerConnected) {
        throw new ExternalDependencyUnavailableError(
          'Failed to produce message: Producer not connected',
          'Kafka',
          'message-broker',
          { topic },
          undefined,
          undefined,
          { topic, message }
        );
      }
      
      // Simulate packet loss
      if (this.shouldSimulatePacketLoss()) {
        throw new ExternalError(
          'Failed to produce message: Network error',
          `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_001`,
          'Kafka',
          { topic },
          undefined,
          undefined,
          { topic, message },
          'Check network connectivity and retry',
          new Error('Simulated packet loss')
        );
      }
      
      // Simulate producer errors based on configuration
      if (this.shouldSimulateProducerError(topic, key)) {
        this.throwSimulatedProducerError(topic);
      }
      
      try {
        // Serialize message
        const serializedMessage = this.serializeMessage(message);
        
        // Store message in-memory
        const partition = 0; // Mock always uses partition 0
        const offset = this.getNextOffset(topic);
        
        const storedMessage: StoredMessage = {
          topic,
          partition,
          offset,
          key,
          value: message,
          headers,
          timestamp: new Date()
        };
        
        // Initialize topic if it doesn't exist
        if (!this.messages.has(topic)) {
          this.messages.set(topic, []);
        }
        
        // Add message to topic
        this.messages.get(topic)!.push(storedMessage);
        
        this.logger.debug(
          `Mock Kafka: Message sent to topic ${topic}`,
          'MockKafkaService'
        );
        
        // Process message for any subscribed consumers
        this.processMessageForConsumers(storedMessage);
        
        return;
      } catch (error) {
        this.logger.error(`Failed to produce message to topic ${topic}`, error, 'MockKafkaService');
        throw new BaseError(
          `Failed to produce message to topic ${topic}`,
          ErrorType.EXTERNAL,
          `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_002`,
          { topic },
          { originalMessage: message },
          'Check message format and retry',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    });
  }

  /**
   * Simulates subscribing to a Kafka topic and processing messages.
   * 
   * @param topic - The Kafka topic to subscribe to
   * @param groupId - The consumer group ID
   * @param callback - The function to process each message
   */
  async consume(
    topic: string,
    groupId: string,
    callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>
  ): Promise<void> {
    // Simulate network latency
    await this.simulateNetworkLatency();
    
    // Check if consumer is connected
    if (!this.consumerConnected) {
      throw new ExternalDependencyUnavailableError(
        'Failed to consume messages: Consumer not connected',
        'Kafka',
        'message-broker',
        { topic, groupId },
        undefined,
        undefined,
        { topic, groupId }
      );
    }
    
    try {
      // Create consumer config if it doesn't exist
      if (!this.consumers.has(groupId)) {
        this.consumers.set(groupId, {
          groupId,
          topics: new Set(),
          fromBeginning: false,
          callbacks: new Map()
        });
      }
      
      const consumer = this.consumers.get(groupId)!;
      
      // Add topic to consumer's subscribed topics
      consumer.topics.add(topic);
      
      // Register callback for topic
      consumer.callbacks.set(topic, callback);
      
      this.logger.log(`Mock Kafka: Subscribed to topic ${topic} with group ID ${groupId}`, 'MockKafkaService');
      
      // Process any existing messages for this topic if fromBeginning is true
      if (consumer.fromBeginning && this.messages.has(topic)) {
        const messages = this.messages.get(topic)!;
        for (const message of messages) {
          await this.processMessageForConsumer(message, consumer);
        }
      }
      
      return;
    } catch (error) {
      this.logger.error(`Failed to consume from topic ${topic}`, error, 'MockKafkaService');
      throw new BaseError(
        `Failed to consume from topic ${topic}`,
        ErrorType.EXTERNAL,
        `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_003`,
        { topic, groupId },
        undefined,
        'Check consumer configuration and retry',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Clears all stored messages and consumer configurations.
   * Useful for resetting the mock between tests.
   */
  reset(): void {
    this.messages.clear();
    this.consumers.clear();
    this.offsetCounter.clear();
    this.connected = true;
    this.producerConnected = true;
    this.consumerConnected = true;
    this.logger.log('Mock Kafka service reset', 'MockKafkaService');
  }

  /**
   * Updates the error simulation configuration.
   * 
   * @param config - New error simulation configuration
   */
  setErrorConfig(config: ErrorSimulationConfig): void {
    this.errorConfig = {
      ...this.errorConfig,
      ...config
    };
  }

  /**
   * Simulates a producer connection failure.
   */
  simulateProducerConnectionFailure(): void {
    this.producerConnected = false;
  }

  /**
   * Simulates a consumer connection failure.
   */
  simulateConsumerConnectionFailure(): void {
    this.consumerConnected = false;
  }

  /**
   * Simulates a complete connection failure.
   */
  simulateConnectionFailure(): void {
    this.producerConnected = false;
    this.consumerConnected = false;
    this.connected = false;
  }

  /**
   * Simulates a connection recovery.
   */
  simulateConnectionRecovery(): void {
    this.producerConnected = true;
    this.consumerConnected = true;
    this.connected = true;
  }

  /**
   * Gets all messages for a specific topic.
   * 
   * @param topic - The Kafka topic
   * @returns Array of stored messages for the topic
   */
  getMessages(topic: string): StoredMessage[] {
    return this.messages.get(topic) || [];
  }

  /**
   * Gets the count of messages for a specific topic.
   * 
   * @param topic - The Kafka topic
   * @returns Number of messages in the topic
   */
  getMessageCount(topic: string): number {
    return this.getMessages(topic).length;
  }

  /**
   * Checks if a specific message exists in a topic.
   * 
   * @param topic - The Kafka topic
   * @param predicate - Function to test each message
   * @returns True if a message matching the predicate exists
   */
  hasMessage(topic: string, predicate: (message: any) => boolean): boolean {
    const messages = this.getMessages(topic);
    return messages.some(msg => predicate(msg.value));
  }

  /**
   * Finds a specific message in a topic.
   * 
   * @param topic - The Kafka topic
   * @param predicate - Function to test each message
   * @returns The first message matching the predicate, or undefined
   */
  findMessage(topic: string, predicate: (message: any) => boolean): StoredMessage | undefined {
    const messages = this.getMessages(topic);
    return messages.find(msg => predicate(msg.value));
  }

  /**
   * Adds a message directly to a topic without going through the produce method.
   * Useful for setting up test scenarios.
   * 
   * @param topic - The Kafka topic
   * @param message - The message to add
   * @param key - Optional message key
   * @param headers - Optional message headers
   */
  addMessage(topic: string, message: any, key?: string, headers?: Record<string, string>): void {
    if (!this.messages.has(topic)) {
      this.messages.set(topic, []);
    }
    
    const offset = this.getNextOffset(topic);
    
    const storedMessage: StoredMessage = {
      topic,
      partition: 0,
      offset,
      key,
      value: message,
      headers,
      timestamp: new Date()
    };
    
    this.messages.get(topic)!.push(storedMessage);
    this.logger.debug(`Mock Kafka: Message manually added to topic ${topic}`, 'MockKafkaService');
  }

  /**
   * Connects the mock Kafka producer.
   * @private
   */
  private async connectProducer(): Promise<void> {
    // Simulate network latency
    await this.simulateNetworkLatency();
    
    // Simulate connection failure based on configuration
    if (this.errorConfig.producerErrorType === 'connection' && Math.random() < (this.errorConfig.producerErrorRate || 0)) {
      this.producerConnected = false;
      throw new ExternalDependencyUnavailableError(
        'Failed to connect Kafka producer',
        'Kafka',
        'message-broker',
        {},
        undefined,
        undefined,
        {},
        new Error('Simulated connection failure')
      );
    }
    
    this.producerConnected = true;
    this.logger.log('Mock Kafka producer connected successfully', 'MockKafkaService');
  }

  /**
   * Disconnects the mock Kafka producer.
   * @private
   */
  private async disconnectProducer(): Promise<void> {
    // Simulate network latency
    await this.simulateNetworkLatency();
    
    this.producerConnected = false;
    this.logger.log('Mock Kafka producer disconnected successfully', 'MockKafkaService');
  }

  /**
   * Connects the mock Kafka consumer.
   * @private
   */
  private async connectConsumer(): Promise<void> {
    // Simulate network latency
    await this.simulateNetworkLatency();
    
    // Simulate connection failure based on configuration
    if (this.errorConfig.consumerErrorType === 'connection' && Math.random() < (this.errorConfig.consumerErrorRate || 0)) {
      this.consumerConnected = false;
      throw new ExternalDependencyUnavailableError(
        'Failed to connect Kafka consumer',
        'Kafka',
        'message-broker',
        {},
        undefined,
        undefined,
        {},
        new Error('Simulated connection failure')
      );
    }
    
    this.consumerConnected = true;
    this.logger.log('Mock Kafka consumer connected successfully', 'MockKafkaService');
  }

  /**
   * Disconnects the mock Kafka consumer.
   * @private
   */
  private async disconnectConsumer(): Promise<void> {
    // Simulate network latency
    await this.simulateNetworkLatency();
    
    this.consumerConnected = false;
    this.logger.log('Mock Kafka consumer disconnected successfully', 'MockKafkaService');
  }

  /**
   * Serializes a message to JSON string.
   * @private
   */
  private serializeMessage(message: any): Buffer {
    try {
      return Buffer.from(JSON.stringify(message));
    } catch (error) {
      this.logger.error('Failed to serialize message', error, 'MockKafkaService');
      throw new BaseError(
        'Failed to serialize message',
        ErrorType.TECHNICAL,
        `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_004`,
        {},
        { message },
        'Check message format and ensure it can be serialized to JSON',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Deserializes a message from JSON string.
   * @private
   */
  private deserializeMessage(buffer: Buffer): any {
    try {
      const message = buffer.toString();
      return JSON.parse(message);
    } catch (error) {
      this.logger.error('Failed to deserialize message', error, 'MockKafkaService');
      throw new BaseError(
        'Failed to deserialize message',
        ErrorType.TECHNICAL,
        `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_005`,
        {},
        { buffer: buffer.toString() },
        'Check message format and ensure it is valid JSON',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Gets the next offset for a topic.
   * @private
   */
  private getNextOffset(topic: string): number {
    const currentOffset = this.offsetCounter.get(topic) || 0;
    const nextOffset = currentOffset + 1;
    this.offsetCounter.set(topic, nextOffset);
    return nextOffset;
  }

  /**
   * Processes a message for all subscribed consumers.
   * @private
   */
  private async processMessageForConsumers(message: StoredMessage): Promise<void> {
    for (const consumer of this.consumers.values()) {
      if (consumer.topics.has(message.topic)) {
        await this.processMessageForConsumer(message, consumer);
      }
    }
  }

  /**
   * Processes a message for a specific consumer.
   * @private
   */
  private async processMessageForConsumer(message: StoredMessage, consumer: ConsumerConfig): Promise<void> {
    // Simulate network latency
    await this.simulateNetworkLatency();
    
    // Get callback for topic
    const callback = consumer.callbacks.get(message.topic);
    if (!callback) {
      return;
    }
    
    // Simulate consumer errors based on configuration
    if (this.shouldSimulateConsumerError(message.topic, message.key)) {
      this.throwSimulatedConsumerError(message.topic);
      return;
    }
    
    try {
      // Process message with callback
      await this.tracingService.createSpan(`kafka.consume.${message.topic}`, async () => {
        try {
          this.logger.debug(
            `Mock Kafka: Processing message from topic ${message.topic}, partition ${message.partition}, offset ${message.offset}`,
            'MockKafkaService'
          );
          
          await callback(message.value, message.key, message.headers);
        } catch (error) {
          this.logger.error(
            `Error processing message from topic ${message.topic}, partition ${message.partition}, offset ${message.offset}`,
            error,
            'MockKafkaService'
          );
          // Don't rethrow to prevent consumer from crashing, matching real Kafka behavior
        }
      });
    } catch (error) {
      this.logger.error(
        `Error in consumer processing for topic ${message.topic}`,
        error,
        'MockKafkaService'
      );
    }
  }

  /**
   * Simulates network latency based on configuration.
   * @private
   */
  private async simulateNetworkLatency(): Promise<void> {
    const baseLatency = this.errorConfig.networkLatencyMs || 0;
    const jitter = this.errorConfig.networkJitterMs || 0;
    
    if (baseLatency > 0 || jitter > 0) {
      const latency = baseLatency + (Math.random() * 2 - 1) * jitter;
      if (latency > 0) {
        await new Promise(resolve => setTimeout(resolve, latency));
      }
    }
  }

  /**
   * Determines if packet loss should be simulated based on configuration.
   * @private
   */
  private shouldSimulatePacketLoss(): boolean {
    return Math.random() < (this.errorConfig.packetLossRate || 0);
  }

  /**
   * Determines if a producer error should be simulated based on configuration.
   * @private
   */
  private shouldSimulateProducerError(topic: string, key?: string): boolean {
    // Check if error should be triggered based on error rate
    if (Math.random() >= (this.errorConfig.producerErrorRate || 0)) {
      return false;
    }
    
    // Check if topic is in the list of error topics
    if (this.errorConfig.producerErrorTopics && 
        this.errorConfig.producerErrorTopics.length > 0 && 
        !this.errorConfig.producerErrorTopics.includes(topic)) {
      return false;
    }
    
    // Check if key is in the list of error keys
    if (key && 
        this.errorConfig.errorKeys && 
        this.errorConfig.errorKeys.length > 0 && 
        !this.errorConfig.errorKeys.includes(key)) {
      return false;
    }
    
    return true;
  }

  /**
   * Determines if a consumer error should be simulated based on configuration.
   * @private
   */
  private shouldSimulateConsumerError(topic: string, key?: string): boolean {
    // Check if error should be triggered based on error rate
    if (Math.random() >= (this.errorConfig.consumerErrorRate || 0)) {
      return false;
    }
    
    // Check if topic is in the list of error topics
    if (this.errorConfig.consumerErrorTopics && 
        this.errorConfig.consumerErrorTopics.length > 0 && 
        !this.errorConfig.consumerErrorTopics.includes(topic)) {
      return false;
    }
    
    // Check if key is in the list of error keys
    if (key && 
        this.errorConfig.errorKeys && 
        this.errorConfig.errorKeys.length > 0 && 
        !this.errorConfig.errorKeys.includes(key)) {
      return false;
    }
    
    return true;
  }

  /**
   * Throws a simulated producer error based on configuration.
   * @private
   */
  private throwSimulatedProducerError(topic: string): never {
    const errorType = this.errorConfig.producerErrorType || 'connection';
    
    switch (errorType) {
      case 'connection':
        throw new ExternalDependencyUnavailableError(
          'Failed to produce message: Connection error',
          'Kafka',
          'message-broker',
          { topic, journey: JourneyContext.SYSTEM },
          undefined,
          undefined,
          { topic },
          new Error('Simulated connection error')
        );
      
      case 'rate_limit':
        throw new ExternalRateLimitError(
          'Failed to produce message: Rate limit exceeded',
          'Kafka',
          10, // Retry after 10 seconds
          '100 messages per second',
          { topic, journey: JourneyContext.SYSTEM },
          429,
          { error: 'Too many requests' },
          { topic },
          new Error('Simulated rate limit error')
        );
      
      case 'serialization':
        throw new BaseError(
          'Failed to serialize message',
          ErrorType.TECHNICAL,
          `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_006`,
          { topic, journey: JourneyContext.SYSTEM },
          { topic },
          'Check message format and ensure it can be serialized',
          new Error('Simulated serialization error')
        );
      
      case 'unavailable':
        throw new ExternalDependencyUnavailableError(
          'Failed to produce message: Service unavailable',
          'Kafka',
          'message-broker',
          { topic, journey: JourneyContext.SYSTEM },
          503,
          { error: 'Service unavailable' },
          { topic },
          new Error('Simulated service unavailable error')
        );
      
      default:
        throw new BaseError(
          'Failed to produce message: Unknown error',
          ErrorType.EXTERNAL,
          `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_007`,
          { topic, journey: JourneyContext.SYSTEM },
          { topic },
          'Retry the operation',
          new Error('Simulated unknown error')
        );
    }
  }

  /**
   * Throws a simulated consumer error based on configuration.
   * @private
   */
  private throwSimulatedConsumerError(topic: string): never {
    const errorType = this.errorConfig.consumerErrorType || 'connection';
    
    switch (errorType) {
      case 'connection':
        throw new ExternalDependencyUnavailableError(
          'Failed to consume message: Connection error',
          'Kafka',
          'message-broker',
          { topic, journey: JourneyContext.SYSTEM },
          undefined,
          undefined,
          { topic },
          new Error('Simulated connection error')
        );
      
      case 'deserialization':
        throw new BaseError(
          'Failed to deserialize message',
          ErrorType.TECHNICAL,
          `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_008`,
          { topic, journey: JourneyContext.SYSTEM },
          { topic },
          'Check message format and ensure it is valid',
          new Error('Simulated deserialization error')
        );
      
      case 'processing':
        throw new BaseError(
          'Failed to process message',
          ErrorType.TECHNICAL,
          `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_009`,
          { topic, journey: JourneyContext.SYSTEM },
          { topic },
          'Check message handler implementation',
          new Error('Simulated processing error')
        );
      
      case 'unavailable':
        throw new ExternalDependencyUnavailableError(
          'Failed to consume message: Service unavailable',
          'Kafka',
          'message-broker',
          { topic, journey: JourneyContext.SYSTEM },
          503,
          { error: 'Service unavailable' },
          { topic },
          new Error('Simulated service unavailable error')
        );
      
      default:
        throw new BaseError(
          'Failed to consume message: Unknown error',
          ErrorType.EXTERNAL,
          `${ERROR_CODE_PREFIXES.GENERAL}_KAFKA_010`,
          { topic, journey: JourneyContext.SYSTEM },
          { topic },
          'Retry the operation',
          new Error('Simulated unknown error')
        );
    }
  }
}
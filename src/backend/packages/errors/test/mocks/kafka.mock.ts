/**
 * @file Mock implementation of KafkaService for testing error handling in event processing.
 * 
 * This mock simulates the behavior of the Kafka message broker without requiring actual Kafka
 * infrastructure, enabling tests to verify error handling during event production and consumption.
 * It captures produced messages and provides configurable consumer behavior to simulate different
 * error scenarios. The implementation follows the same interface as the production KafkaService,
 * allowing drop-in replacement in tests.
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

/**
 * Interface representing a Kafka message with value, key, and headers
 */
export interface MockKafkaMessage {
  topic: string;
  value: any;
  key?: string;
  headers?: Record<string, string>;
  timestamp?: number;
}

/**
 * Interface for configuring error scenarios in the KafkaMock
 */
export interface KafkaMockOptions {
  /**
   * When true, the produce method will throw an error
   */
  simulateProducerError?: boolean;
  
  /**
   * When true, the consumer callback will throw an error
   */
  simulateConsumerError?: boolean;
  
  /**
   * When true, the connection methods will throw errors
   */
  simulateConnectionError?: boolean;
  
  /**
   * When true, message serialization will fail
   */
  simulateSerializationError?: boolean;
  
  /**
   * When true, message deserialization will fail
   */
  simulateDeserializationError?: boolean;
  
  /**
   * Custom error to throw when simulating errors
   */
  customError?: Error;
}

/**
 * Mock implementation of KafkaService for testing error handling in event processing.
 */
@Injectable()
export class KafkaMock implements OnModuleInit, OnModuleDestroy {
  /**
   * In-memory storage for produced messages
   */
  private messages: MockKafkaMessage[] = [];
  
  /**
   * Map of registered consumer callbacks by topic
   */
  private consumers: Map<string, {
    groupId: string;
    callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>;
  }> = new Map();
  
  /**
   * Configuration options for simulating error scenarios
   */
  private options: KafkaMockOptions = {};
  
  /**
   * Connection state flags
   */
  private producerConnected = false;
  private consumerConnected = false;

  /**
   * Creates a new KafkaMock instance with optional error simulation configuration.
   * 
   * @param options - Configuration options for simulating error scenarios
   */
  constructor(options: KafkaMockOptions = {}) {
    this.options = options;
  }

  /**
   * Initializes the mock Kafka producer and consumer.
   * Simulates connection errors if configured.
   */
  async onModuleInit(): Promise<void> {
    if (this.options.simulateConnectionError) {
      throw this.createError('Failed to initialize Kafka service');
    }
    
    await this.connectProducer();
    await this.connectConsumer();
  }

  /**
   * Disconnects the mock Kafka producer and consumer.
   * Does not throw errors even if configured to simulate connection errors.
   */
  async onModuleDestroy(): Promise<void> {
    await this.disconnectProducer();
    await this.disconnectConsumer();
  }

  /**
   * Simulates sending a message to a Kafka topic.
   * Stores the message in memory and simulates errors if configured.
   * 
   * @param topic - The Kafka topic to send the message to
   * @param message - The message object to be serialized and sent
   * @param key - Optional message key for partitioning
   * @param headers - Optional message headers
   * @throws Error when simulateProducerError is true
   */
  async produce(
    topic: string, 
    message: any, 
    key?: string, 
    headers?: Record<string, string>
  ): Promise<void> {
    // Check if producer is connected
    if (!this.producerConnected) {
      throw this.createError('Producer is not connected');
    }
    
    // Simulate producer errors if configured
    if (this.options.simulateProducerError) {
      throw this.createError('Failed to produce message to topic ' + topic);
    }
    
    // Simulate serialization errors if configured
    if (this.options.simulateSerializationError) {
      throw this.createError('Failed to serialize message');
    }
    
    // Store the message in memory
    this.messages.push({
      topic,
      value: message,
      key,
      headers,
      timestamp: Date.now()
    });
    
    // Process the message immediately if there's a consumer for this topic
    this.processMessage(topic, message, key, headers);
  }

  /**
   * Simulates subscribing to a Kafka topic and processing messages.
   * Registers the callback for later use when messages are produced.
   * 
   * @param topic - The Kafka topic to subscribe to
   * @param groupId - The consumer group ID
   * @param callback - The function to process each message
   * @throws Error when simulateConsumerError is true during registration
   */
  async consume(
    topic: string,
    groupId: string,
    callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>
  ): Promise<void> {
    // Check if consumer is connected
    if (!this.consumerConnected) {
      throw this.createError('Consumer is not connected');
    }
    
    // Register the consumer callback
    this.consumers.set(topic, { groupId, callback });
    
    // Process any existing messages for this topic
    const existingMessages = this.messages.filter(msg => msg.topic === topic);
    for (const msg of existingMessages) {
      await this.processMessage(topic, msg.value, msg.key, msg.headers);
    }
  }

  /**
   * Processes a message by calling the registered consumer callback for the topic.
   * Simulates consumer errors if configured.
   * 
   * @param topic - The topic the message was sent to
   * @param message - The message value
   * @param key - Optional message key
   * @param headers - Optional message headers
   * @private
   */
  private async processMessage(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>
  ): Promise<void> {
    const consumer = this.consumers.get(topic);
    if (!consumer) {
      return; // No consumer registered for this topic
    }
    
    try {
      // Simulate deserialization errors if configured
      if (this.options.simulateDeserializationError) {
        throw this.createError('Failed to deserialize message');
      }
      
      // Simulate consumer errors if configured
      if (this.options.simulateConsumerError) {
        throw this.createError('Error processing message from topic ' + topic);
      }
      
      // Call the consumer callback
      await consumer.callback(message, key, headers);
    } catch (error) {
      // In the real implementation, errors are caught and logged but not rethrown
      // to prevent the consumer from crashing
    }
  }

  /**
   * Simulates connecting to Kafka as a producer.
   * @private
   */
  private async connectProducer(): Promise<void> {
    if (this.options.simulateConnectionError) {
      throw this.createError('Failed to connect Kafka producer');
    }
    this.producerConnected = true;
  }

  /**
   * Simulates disconnecting the Kafka producer.
   * @private
   */
  private async disconnectProducer(): Promise<void> {
    this.producerConnected = false;
  }

  /**
   * Simulates connecting to Kafka as a consumer.
   * @private
   */
  private async connectConsumer(): Promise<void> {
    if (this.options.simulateConnectionError) {
      throw this.createError('Failed to connect Kafka consumer');
    }
    this.consumerConnected = true;
  }

  /**
   * Simulates disconnecting the Kafka consumer.
   * @private
   */
  private async disconnectConsumer(): Promise<void> {
    this.consumerConnected = false;
  }

  /**
   * Creates an error with the given message, using the custom error if provided.
   * @private
   */
  private createError(message: string): Error {
    if (this.options.customError) {
      return this.options.customError;
    }
    return new Error(message);
  }

  // Test utility methods

  /**
   * Gets all messages produced to Kafka topics.
   * 
   * @returns Array of all produced messages
   */
  getProducedMessages(): MockKafkaMessage[] {
    return [...this.messages];
  }

  /**
   * Gets messages produced to a specific Kafka topic.
   * 
   * @param topic - The topic to filter messages by
   * @returns Array of messages produced to the specified topic
   */
  getProducedMessagesByTopic(topic: string): MockKafkaMessage[] {
    return this.messages.filter(msg => msg.topic === topic);
  }

  /**
   * Clears all stored messages.
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Configures the mock to simulate producer errors.
   * 
   * @param simulate - Whether to simulate producer errors
   */
  simulateProducerError(simulate = true): void {
    this.options.simulateProducerError = simulate;
  }

  /**
   * Configures the mock to simulate consumer errors.
   * 
   * @param simulate - Whether to simulate consumer errors
   */
  simulateConsumerError(simulate = true): void {
    this.options.simulateConsumerError = simulate;
  }

  /**
   * Configures the mock to simulate connection errors.
   * 
   * @param simulate - Whether to simulate connection errors
   */
  simulateConnectionError(simulate = true): void {
    this.options.simulateConnectionError = simulate;
  }

  /**
   * Configures the mock to simulate serialization errors.
   * 
   * @param simulate - Whether to simulate serialization errors
   */
  simulateSerializationError(simulate = true): void {
    this.options.simulateSerializationError = simulate;
  }

  /**
   * Configures the mock to simulate deserialization errors.
   * 
   * @param simulate - Whether to simulate deserialization errors
   */
  simulateDeserializationError(simulate = true): void {
    this.options.simulateDeserializationError = simulate;
  }

  /**
   * Sets a custom error to be thrown when simulating errors.
   * 
   * @param error - The custom error to throw
   */
  setCustomError(error: Error): void {
    this.options.customError = error;
  }

  /**
   * Manually triggers processing of a message as if it was received from Kafka.
   * Useful for testing consumer error handling without producing a message.
   * 
   * @param topic - The topic to simulate receiving a message on
   * @param message - The message to process
   * @param key - Optional message key
   * @param headers - Optional message headers
   */
  async simulateIncomingMessage(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>
  ): Promise<void> {
    await this.processMessage(topic, message, key, headers);
  }

  /**
   * Gets the registered consumer for a topic.
   * 
   * @param topic - The topic to get the consumer for
   * @returns The consumer configuration or undefined if none exists
   */
  getConsumer(topic: string) {
    return this.consumers.get(topic);
  }

  /**
   * Checks if a consumer is registered for a topic.
   * 
   * @param topic - The topic to check
   * @returns True if a consumer is registered for the topic
   */
  hasConsumer(topic: string): boolean {
    return this.consumers.has(topic);
  }

  /**
   * Gets all registered consumer topics.
   * 
   * @returns Array of topics with registered consumers
   */
  getConsumerTopics(): string[] {
    return Array.from(this.consumers.keys());
  }
}

/**
 * Factory function to create a pre-configured KafkaMock instance.
 * 
 * @param options - Configuration options for the KafkaMock
 * @returns A new KafkaMock instance
 */
export function createKafkaMock(options: KafkaMockOptions = {}): KafkaMock {
  return new KafkaMock(options);
}

/**
 * Creates a KafkaMock instance pre-configured to simulate producer errors.
 * 
 * @returns A KafkaMock instance that simulates producer errors
 */
export function createFailingProducerMock(): KafkaMock {
  return new KafkaMock({ simulateProducerError: true });
}

/**
 * Creates a KafkaMock instance pre-configured to simulate consumer errors.
 * 
 * @returns A KafkaMock instance that simulates consumer errors
 */
export function createFailingConsumerMock(): KafkaMock {
  return new KafkaMock({ simulateConsumerError: true });
}

/**
 * Creates a KafkaMock instance pre-configured to simulate connection errors.
 * 
 * @returns A KafkaMock instance that simulates connection errors
 */
export function createConnectionFailureMock(): KafkaMock {
  return new KafkaMock({ simulateConnectionError: true });
}

/**
 * Creates a KafkaMock instance pre-configured to simulate serialization errors.
 * 
 * @returns A KafkaMock instance that simulates serialization errors
 */
export function createSerializationFailureMock(): KafkaMock {
  return new KafkaMock({ simulateSerializationError: true });
}

/**
 * Creates a KafkaMock instance pre-configured to simulate deserialization errors.
 * 
 * @returns A KafkaMock instance that simulates deserialization errors
 */
export function createDeserializationFailureMock(): KafkaMock {
  return new KafkaMock({ simulateDeserializationError: true });
}
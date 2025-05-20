/**
 * @file kafka-test-client.ts
 * @description Provides a mock Kafka client implementation for testing event publishing and consuming
 * without requiring a real Kafka connection. This utility enables comprehensive testing of
 * Kafka-based event processing in isolated test environments.
 *
 * Features:
 * - Mock Kafka producer for testing event publishing
 * - Mock Kafka consumer for testing event subscription
 * - Event delivery simulation with controllable timing
 * - Error injection capabilities for testing error handling
 * - Test utilities for verifying topic partitioning and message ordering
 * - Support for dead letter queues and retry mechanisms
 * - Audit logging of all events for verification
 *
 * Example usage:
 * ```typescript
 * // Create a test client
 * const testClient = new KafkaTestClient();
 * 
 * // Register a consumer
 * testClient.registerConsumer('test-topic', async (message) => {
 *   // Process message
 *   console.log(message);
 * });
 * 
 * // Produce a message
 * await testClient.produce('test-topic', { value: 'test-message' });
 * 
 * // Verify message was processed
 * expect(testClient.getProcessedMessages('test-topic')).toHaveLength(1);
 * ```
 */

import { EventMetadataDto } from '../../src/dto/event-metadata.dto';
import { KafkaMessage } from '../../src/interfaces/kafka-message.interface';
import { TOPICS } from '../../src/constants/topics.constants';
import { ERROR_CODES } from '../../src/constants/errors.constants';

/**
 * Configuration options for the KafkaTestClient.
 */
export interface KafkaTestClientOptions {
  /**
   * Whether to deliver messages immediately or require manual delivery.
   * @default true
   */
  autoDeliverMessages?: boolean;

  /**
   * Default delay in milliseconds before delivering messages when auto-delivery is enabled.
   * @default 0
   */
  defaultDeliveryDelay?: number;

  /**
   * Whether to enable the dead letter queue for failed messages.
   * @default true
   */
  enableDeadLetterQueue?: boolean;

  /**
   * Maximum number of retry attempts for failed messages.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for retry attempts (will be multiplied by backoff factor).
   * @default 100
   */
  retryBaseDelay?: number;

  /**
   * Backoff factor for retry delay calculation.
   * @default 2
   */
  retryBackoffFactor?: number;

  /**
   * Whether to log events to the console.
   * @default false
   */
  enableConsoleLogging?: boolean;
}

/**
 * Options for producing a message.
 */
export interface ProduceOptions {
  /**
   * Message key for partitioning.
   */
  key?: string;

  /**
   * Message headers.
   */
  headers?: Record<string, string>;

  /**
   * Whether to simulate a producer error.
   */
  simulateError?: boolean;

  /**
   * Custom error message when simulating an error.
   */
  errorMessage?: string;

  /**
   * Delay in milliseconds before delivering the message (overrides default).
   */
  deliveryDelay?: number;
}

/**
 * Options for consuming messages.
 */
export interface ConsumeOptions {
  /**
   * Consumer group ID.
   */
  groupId?: string;

  /**
   * Whether to consume from the beginning of the topic.
   */
  fromBeginning?: boolean;

  /**
   * Maximum number of retry attempts for failed messages.
   */
  maxRetries?: number;

  /**
   * Whether to use the dead letter queue for failed messages.
   */
  useDLQ?: boolean;
}

/**
 * Represents a message in the test client's internal storage.
 */
export interface StoredMessage<T = any> {
  /**
   * The topic the message was sent to.
   */
  topic: string;

  /**
   * The partition the message was assigned to.
   */
  partition: number;

  /**
   * The message value.
   */
  value: T;

  /**
   * The message key, if provided.
   */
  key?: string;

  /**
   * The message headers.
   */
  headers: Record<string, string>;

  /**
   * The message offset in the partition.
   */
  offset: string;

  /**
   * The timestamp when the message was produced.
   */
  timestamp: string;

  /**
   * The number of times this message has been retried.
   */
  retryCount: number;

  /**
   * Whether the message has been processed.
   */
  processed: boolean;

  /**
   * Whether the message processing failed.
   */
  failed: boolean;

  /**
   * Error message if processing failed.
   */
  error?: string;

  /**
   * Whether the message was sent to the dead letter queue.
   */
  sentToDLQ: boolean;
}

/**
 * Type for message handler functions.
 */
export type MessageHandler<T = any> = (value: T, metadata: KafkaMessage) => Promise<void>;

/**
 * Mock Kafka client for testing event publishing and consuming.
 */
export class KafkaTestClient {
  private options: Required<KafkaTestClientOptions>;
  private messages: Map<string, StoredMessage[]> = new Map();
  private consumers: Map<string, Map<string, MessageHandler>> = new Map();
  private consumerGroups: Map<string, Set<string>> = new Map();
  private partitionCounters: Map<string, number> = new Map();
  private offsetCounters: Map<string, Map<number, number>> = new Map();
  private processingPromises: Promise<void>[] = [];
  private eventLog: Array<{
    type: 'PRODUCE' | 'CONSUME' | 'RETRY' | 'DLQ' | 'ERROR';
    topic: string;
    timestamp: Date;
    messageId?: string;
    details?: any;
  }> = [];

  /**
   * Creates a new KafkaTestClient with the specified options.
   * 
   * @param options Configuration options for the test client
   */
  constructor(options: KafkaTestClientOptions = {}) {
    this.options = {
      autoDeliverMessages: options.autoDeliverMessages ?? true,
      defaultDeliveryDelay: options.defaultDeliveryDelay ?? 0,
      enableDeadLetterQueue: options.enableDeadLetterQueue ?? true,
      maxRetries: options.maxRetries ?? 3,
      retryBaseDelay: options.retryBaseDelay ?? 100,
      retryBackoffFactor: options.retryBackoffFactor ?? 2,
      enableConsoleLogging: options.enableConsoleLogging ?? false,
    };

    // Initialize the dead letter queue topic
    this.messages.set(TOPICS.DEAD_LETTER, []);
    this.log('PRODUCE', TOPICS.DEAD_LETTER, { action: 'INITIALIZE_TOPIC' });
  }

  /**
   * Produces a message to the specified topic.
   * 
   * @param topic The topic to produce to
   * @param value The message value
   * @param options Additional options for producing the message
   * @returns A promise that resolves when the message is produced
   * @throws If simulating an error or if the topic is invalid
   */
  async produce<T = any>(
    topic: string,
    value: T,
    options: ProduceOptions = {}
  ): Promise<void> {
    // Simulate producer error if requested
    if (options.simulateError) {
      const error = new Error(options.errorMessage || `Simulated producer error for topic ${topic}`);
      this.log('ERROR', topic, { error: error.message, value });
      throw error;
    }

    // Ensure the topic exists in our storage
    if (!this.messages.has(topic)) {
      this.messages.set(topic, []);
      this.partitionCounters.set(topic, 0);
      this.offsetCounters.set(topic, new Map());
    }

    // Determine partition (simple round-robin for testing)
    const partition = this.getNextPartition(topic);
    
    // Get the next offset for this partition
    const offset = this.getNextOffset(topic, partition).toString();
    
    // Add metadata if not present
    let enrichedValue = value;
    if (this.isObject(value) && !this.hasMetadata(value)) {
      enrichedValue = this.addMetadata(value as any);
    }

    // Create the stored message
    const message: StoredMessage<T> = {
      topic,
      partition,
      value: enrichedValue,
      key: options.key,
      headers: options.headers || {},
      offset,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      processed: false,
      failed: false,
      sentToDLQ: false,
    };

    // Store the message
    this.messages.get(topic)!.push(message);
    
    // Log the production
    this.log('PRODUCE', topic, { 
      partition, 
      offset, 
      key: options.key,
      headers: options.headers,
      hasMetadata: this.hasMetadata(enrichedValue)
    });

    // Auto-deliver the message if enabled
    if (this.options.autoDeliverMessages) {
      const delay = options.deliveryDelay ?? this.options.defaultDeliveryDelay;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      await this.deliverMessages(topic);
    }
  }

  /**
   * Produces multiple messages to the specified topic in a batch.
   * 
   * @param topic The topic to produce to
   * @param messages Array of messages with optional keys and headers
   * @param simulateError Whether to simulate a producer error
   * @returns A promise that resolves when all messages are produced
   * @throws If simulating an error or if the topic is invalid
   */
  async produceBatch<T = any>(
    topic: string,
    messages: Array<{
      value: T;
      key?: string;
      headers?: Record<string, string>;
    }>,
    simulateError = false
  ): Promise<void> {
    // Simulate producer error if requested
    if (simulateError) {
      const error = new Error(`Simulated batch producer error for topic ${topic}`);
      this.log('ERROR', topic, { error: error.message, batchSize: messages.length });
      throw error;
    }

    // Produce each message individually but don't auto-deliver yet
    const autoDeliverSetting = this.options.autoDeliverMessages;
    this.options.autoDeliverMessages = false;
    
    try {
      for (const message of messages) {
        await this.produce(topic, message.value, {
          key: message.key,
          headers: message.headers,
        });
      }
    } finally {
      // Restore auto-deliver setting
      this.options.autoDeliverMessages = autoDeliverSetting;
    }

    // Deliver all messages at once if auto-deliver is enabled
    if (autoDeliverSetting) {
      await this.deliverMessages(topic);
    }
  }

  /**
   * Registers a consumer for the specified topic.
   * 
   * @param topic The topic to consume from
   * @param handler The function to process each message
   * @param options Additional options for consuming
   * @returns A promise that resolves when the consumer is registered
   */
  async consume<T = any>(
    topic: string,
    handler: MessageHandler<T>,
    options: ConsumeOptions = {}
  ): Promise<void> {
    const groupId = options.groupId || 'default-group';
    
    // Create consumer group if it doesn't exist
    if (!this.consumerGroups.has(groupId)) {
      this.consumerGroups.set(groupId, new Set());
    }
    
    // Add topic to consumer group
    this.consumerGroups.get(groupId)!.add(topic);
    
    // Create topic in consumers map if it doesn't exist
    if (!this.consumers.has(topic)) {
      this.consumers.set(topic, new Map());
    }
    
    // Register the handler for this consumer group
    this.consumers.get(topic)!.set(groupId, handler);
    
    // Ensure the topic exists in our storage
    if (!this.messages.has(topic)) {
      this.messages.set(topic, []);
      this.partitionCounters.set(topic, 0);
      this.offsetCounters.set(topic, new Map());
    }
    
    this.log('CONSUME', topic, { 
      action: 'REGISTER_CONSUMER', 
      groupId, 
      fromBeginning: options.fromBeginning,
      maxRetries: options.maxRetries,
      useDLQ: options.useDLQ
    });
    
    // Process existing messages if fromBeginning is true
    if (options.fromBeginning) {
      await this.deliverMessages(topic);
    }
  }

  /**
   * Delivers all unprocessed messages for the specified topic to registered consumers.
   * 
   * @param topic The topic to deliver messages for, or undefined for all topics
   * @returns A promise that resolves when all messages are delivered
   */
  async deliverMessages(topic?: string): Promise<void> {
    const topicsToProcess = topic ? [topic] : Array.from(this.messages.keys());
    
    for (const currentTopic of topicsToProcess) {
      // Skip if no consumers for this topic
      if (!this.consumers.has(currentTopic)) {
        continue;
      }
      
      const messages = this.messages.get(currentTopic) || [];
      const unprocessedMessages = messages.filter(msg => !msg.processed && !msg.sentToDLQ);
      
      if (unprocessedMessages.length === 0) {
        continue;
      }
      
      // Process each message with each consumer group
      for (const message of unprocessedMessages) {
        for (const [groupId, handler] of this.consumers.get(currentTopic)!.entries()) {
          // Create a processing promise for this message and consumer
          const processingPromise = this.processMessage(currentTopic, message, handler, groupId);
          this.processingPromises.push(processingPromise);
        }
      }
    }
    
    // Wait for all processing to complete
    if (this.processingPromises.length > 0) {
      await Promise.all(this.processingPromises);
      this.processingPromises = [];
    }
  }

  /**
   * Processes a single message with the specified handler.
   * 
   * @param topic The topic the message belongs to
   * @param message The message to process
   * @param handler The handler function to process the message
   * @param groupId The consumer group ID
   * @returns A promise that resolves when the message is processed
   * @private
   */
  private async processMessage<T = any>(
    topic: string,
    message: StoredMessage<T>,
    handler: MessageHandler<T>,
    groupId: string
  ): Promise<void> {
    try {
      // Create metadata object for the handler
      const metadata: KafkaMessage = {
        key: message.key,
        headers: { ...message.headers },
        topic: message.topic,
        partition: message.partition,
        offset: message.offset,
        timestamp: message.timestamp,
      };
      
      // Process the message with the handler
      await handler(message.value, metadata);
      
      // Mark as processed
      message.processed = true;
      
      this.log('CONSUME', topic, { 
        action: 'PROCESS_SUCCESS', 
        groupId, 
        partition: message.partition, 
        offset: message.offset,
        key: message.key
      });
    } catch (error) {
      // Mark as failed
      message.failed = true;
      message.error = error instanceof Error ? error.message : String(error);
      
      this.log('ERROR', topic, { 
        action: 'PROCESS_FAILURE', 
        groupId, 
        partition: message.partition, 
        offset: message.offset,
        error: message.error,
        retryCount: message.retryCount,
        key: message.key
      });
      
      // Handle retry logic
      const maxRetries = this.options.maxRetries;
      
      if (message.retryCount < maxRetries) {
        // Increment retry count
        message.retryCount++;
        
        // Calculate retry delay with exponential backoff
        const retryDelay = this.calculateRetryDelay(message.retryCount);
        
        this.log('RETRY', topic, { 
          action: 'SCHEDULE_RETRY', 
          groupId, 
          partition: message.partition, 
          offset: message.offset,
          retryCount: message.retryCount,
          maxRetries,
          retryDelay,
          key: message.key
        });
        
        // Reset processed and failed flags for retry
        message.processed = false;
        message.failed = false;
        
        // Schedule retry after delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await this.processMessage(topic, message, handler, groupId);
      } else if (this.options.enableDeadLetterQueue) {
        // Send to dead letter queue
        await this.sendToDLQ(topic, message, groupId);
      }
    }
  }

  /**
   * Sends a failed message to the dead letter queue.
   * 
   * @param sourceTopic The original topic the message was sent to
   * @param message The failed message
   * @param groupId The consumer group ID that failed to process the message
   * @returns A promise that resolves when the message is sent to the DLQ
   * @private
   */
  private async sendToDLQ<T = any>(
    sourceTopic: string,
    message: StoredMessage<T>,
    groupId: string
  ): Promise<void> {
    try {
      // Mark as sent to DLQ
      message.sentToDLQ = true;
      
      // Create DLQ headers
      const dlqHeaders = {
        ...message.headers,
        'dlq-timestamp': new Date().toISOString(),
        'source-topic': sourceTopic,
        'source-partition': message.partition.toString(),
        'source-offset': message.offset,
        'error-message': message.error || 'Unknown error',
        'retry-count': message.retryCount.toString(),
        'consumer-group': groupId,
      };
      
      // Get the next partition for the DLQ
      const partition = this.getNextPartition(TOPICS.DEAD_LETTER);
      
      // Get the next offset for this partition
      const offset = this.getNextOffset(TOPICS.DEAD_LETTER, partition).toString();
      
      // Create the DLQ message
      const dlqMessage: StoredMessage<T> = {
        topic: TOPICS.DEAD_LETTER,
        partition,
        value: message.value,
        key: message.key,
        headers: dlqHeaders,
        offset,
        timestamp: new Date().toISOString(),
        retryCount: 0, // Reset for DLQ
        processed: false,
        failed: false,
        sentToDLQ: false, // Reset for DLQ
      };
      
      // Store the message in the DLQ
      this.messages.get(TOPICS.DEAD_LETTER)!.push(dlqMessage);
      
      this.log('DLQ', TOPICS.DEAD_LETTER, { 
        action: 'SEND_TO_DLQ', 
        sourceTopic, 
        sourcePartition: message.partition, 
        sourceOffset: message.offset,
        dlqPartition: partition,
        dlqOffset: offset,
        error: message.error,
        retryCount: message.retryCount,
        key: message.key
      });
    } catch (error) {
      this.log('ERROR', TOPICS.DEAD_LETTER, { 
        action: 'DLQ_FAILURE', 
        error: error instanceof Error ? error.message : String(error),
        sourceTopic,
        sourcePartition: message.partition,
        sourceOffset: message.offset,
        key: message.key
      });
      
      // Don't throw to prevent cascading failures
    }
  }

  /**
   * Calculates the retry delay using exponential backoff.
   * 
   * @param attempt The retry attempt number (1-based)
   * @returns The delay in milliseconds
   * @private
   */
  private calculateRetryDelay(attempt: number): number {
    const { retryBaseDelay, retryBackoffFactor } = this.options;
    const delay = retryBaseDelay * Math.pow(retryBackoffFactor, attempt - 1);
    
    // Add jitter to prevent thundering herd problem
    return Math.floor(delay * (0.8 + Math.random() * 0.4));
  }

  /**
   * Gets the next partition number for a topic using round-robin assignment.
   * 
   * @param topic The topic to get the next partition for
   * @returns The partition number
   * @private
   */
  private getNextPartition(topic: string): number {
    // For testing, we'll use a simple round-robin with 3 partitions
    const currentPartition = this.partitionCounters.get(topic) || 0;
    const nextPartition = (currentPartition + 1) % 3; // 3 partitions for testing
    this.partitionCounters.set(topic, nextPartition);
    return nextPartition;
  }

  /**
   * Gets the next offset for a partition.
   * 
   * @param topic The topic to get the next offset for
   * @param partition The partition to get the next offset for
   * @returns The offset number
   * @private
   */
  private getNextOffset(topic: string, partition: number): number {
    if (!this.offsetCounters.has(topic)) {
      this.offsetCounters.set(topic, new Map());
    }
    
    const partitionOffsets = this.offsetCounters.get(topic)!;
    const currentOffset = partitionOffsets.get(partition) || 0;
    const nextOffset = currentOffset + 1;
    partitionOffsets.set(partition, nextOffset);
    return nextOffset;
  }

  /**
   * Checks if a value is an object.
   * 
   * @param value The value to check
   * @returns True if the value is an object, false otherwise
   * @private
   */
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Checks if a message already has metadata attached.
   * 
   * @param message The message to check
   * @returns True if the message has metadata, false otherwise
   * @private
   */
  private hasMetadata(message: any): boolean {
    return this.isObject(message) && 
           this.isObject(message.metadata) && 
           typeof message.metadata.timestamp === 'string';
  }

  /**
   * Adds standard metadata to a message.
   * 
   * @param message The message to add metadata to
   * @returns The message with metadata added
   * @private
   */
  private addMetadata<T = any>(message: T): T & { metadata: EventMetadataDto } {
    const metadata = new EventMetadataDto();
    metadata.timestamp = new Date();
    metadata.correlationId = this.generateUUID();
    
    return {
      ...message as any,
      metadata
    };
  }

  /**
   * Generates a UUID v4 for correlation IDs.
   * 
   * @returns A UUID string
   * @private
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Logs an event to the event log and optionally to the console.
   * 
   * @param type The type of event
   * @param topic The topic the event is related to
   * @param details Additional details about the event
   * @private
   */
  private log(type: 'PRODUCE' | 'CONSUME' | 'RETRY' | 'DLQ' | 'ERROR', topic: string, details?: any): void {
    const event = {
      type,
      topic,
      timestamp: new Date(),
      messageId: details?.key || this.generateUUID(),
      details
    };
    
    this.eventLog.push(event);
    
    if (this.options.enableConsoleLogging) {
      console.log(`[KafkaTestClient] ${type} - ${topic}:`, details);
    }
  }

  /**
   * Gets all messages for a topic.
   * 
   * @param topic The topic to get messages for
   * @returns Array of stored messages
   */
  getMessages<T = any>(topic: string): StoredMessage<T>[] {
    return (this.messages.get(topic) || []) as StoredMessage<T>[];
  }

  /**
   * Gets all processed messages for a topic.
   * 
   * @param topic The topic to get processed messages for
   * @returns Array of processed stored messages
   */
  getProcessedMessages<T = any>(topic: string): StoredMessage<T>[] {
    return this.getMessages<T>(topic).filter(msg => msg.processed);
  }

  /**
   * Gets all failed messages for a topic.
   * 
   * @param topic The topic to get failed messages for
   * @returns Array of failed stored messages
   */
  getFailedMessages<T = any>(topic: string): StoredMessage<T>[] {
    return this.getMessages<T>(topic).filter(msg => msg.failed);
  }

  /**
   * Gets all messages in the dead letter queue.
   * 
   * @returns Array of messages in the DLQ
   */
  getDLQMessages<T = any>(): StoredMessage<T>[] {
    return this.getMessages<T>(TOPICS.DEAD_LETTER);
  }

  /**
   * Gets the event log for auditing and verification.
   * 
   * @returns Array of logged events
   */
  getEventLog(): Array<{
    type: 'PRODUCE' | 'CONSUME' | 'RETRY' | 'DLQ' | 'ERROR';
    topic: string;
    timestamp: Date;
    messageId?: string;
    details?: any;
  }> {
    return [...this.eventLog];
  }

  /**
   * Clears all messages and resets the client state.
   * 
   * @param topic Optional topic to clear, or all topics if not specified
   */
  clear(topic?: string): void {
    if (topic) {
      this.messages.set(topic, []);
      this.partitionCounters.set(topic, 0);
      this.offsetCounters.set(topic, new Map());
    } else {
      this.messages.clear();
      this.partitionCounters.clear();
      this.offsetCounters.clear();
      this.messages.set(TOPICS.DEAD_LETTER, []);
    }
  }

  /**
   * Clears the event log.
   */
  clearEventLog(): void {
    this.eventLog = [];
  }

  /**
   * Simulates a consumer error for testing error handling.
   * 
   * @param topic The topic to simulate an error for
   * @param messageIndex The index of the message to fail, or random if not specified
   * @param errorMessage The error message to use
   */
  simulateConsumerError(topic: string, messageIndex?: number, errorMessage?: string): void {
    const messages = this.getMessages(topic);
    
    if (messages.length === 0) {
      return;
    }
    
    const index = messageIndex !== undefined ? messageIndex : Math.floor(Math.random() * messages.length);
    
    if (index >= 0 && index < messages.length) {
      const message = messages[index];
      message.failed = true;
      message.error = errorMessage || `Simulated consumer error for topic ${topic}`;
      message.processed = false;
      
      this.log('ERROR', topic, { 
        action: 'SIMULATE_ERROR', 
        partition: message.partition, 
        offset: message.offset,
        error: message.error,
        key: message.key
      });
    }
  }

  /**
   * Waits for a specific number of messages to be processed for a topic.
   * 
   * @param topic The topic to wait for
   * @param count The number of processed messages to wait for
   * @param timeout Optional timeout in milliseconds
   * @returns A promise that resolves when the condition is met or rejects on timeout
   */
  async waitForProcessedMessages(topic: string, count: number, timeout?: number): Promise<void> {
    return this.waitForCondition(
      () => this.getProcessedMessages(topic).length >= count,
      `Timed out waiting for ${count} processed messages on topic ${topic}`,
      timeout
    );
  }

  /**
   * Waits for a specific number of messages to be in the dead letter queue.
   * 
   * @param count The number of DLQ messages to wait for
   * @param timeout Optional timeout in milliseconds
   * @returns A promise that resolves when the condition is met or rejects on timeout
   */
  async waitForDLQMessages(count: number, timeout?: number): Promise<void> {
    return this.waitForCondition(
      () => this.getDLQMessages().length >= count,
      `Timed out waiting for ${count} messages in the dead letter queue`,
      timeout
    );
  }

  /**
   * Waits for a condition to be met with an optional timeout.
   * 
   * @param condition The condition function to check
   * @param timeoutMessage The message to use when timing out
   * @param timeout Optional timeout in milliseconds (default: 5000)
   * @returns A promise that resolves when the condition is met or rejects on timeout
   * @private
   */
  private async waitForCondition(
    condition: () => boolean,
    timeoutMessage: string,
    timeout = 5000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error(timeoutMessage);
      }
      
      // Wait a short time before checking again
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * Creates a KafkaTestClient with default options.
 * 
 * @returns A new KafkaTestClient instance
 */
export function createKafkaTestClient(options?: KafkaTestClientOptions): KafkaTestClient {
  return new KafkaTestClient(options);
}

/**
 * Creates a mock Kafka message for testing.
 * 
 * @param topic The topic for the message
 * @param value The message value
 * @param options Additional options for the message
 * @returns A KafkaMessage object
 */
export function createMockKafkaMessage<T = any>(
  topic: string,
  value: T,
  options: {
    key?: string;
    headers?: Record<string, string>;
    partition?: number;
    offset?: string;
    timestamp?: string;
  } = {}
): { value: T; metadata: KafkaMessage } {
  const metadata: KafkaMessage = {
    key: options.key,
    headers: options.headers || {},
    topic,
    partition: options.partition || 0,
    offset: options.offset || '1',
    timestamp: options.timestamp || new Date().toISOString(),
  };
  
  return { value, metadata };
}
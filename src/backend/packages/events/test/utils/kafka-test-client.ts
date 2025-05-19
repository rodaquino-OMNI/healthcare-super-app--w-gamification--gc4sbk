/**
 * @file kafka-test-client.ts
 * @description Provides a mock Kafka client implementation for testing event publishing and consuming
 * without requiring a real Kafka connection. It allows simulation of Kafka behavior, testing of
 * produce/consume patterns, and verification of event handling logic in isolated test environments.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  IKafkaService,
  IKafkaProducerOptions,
  IKafkaConsumerOptions,
  IKafkaDeadLetterQueueConfig,
  IValidationResult,
} from '../../src/kafka/kafka.interfaces';
import {
  EventJourney,
  EventProcessingStatus,
  KafkaErrorType,
  RetryPolicy,
  KafkaHeaders,
  TypedKafkaMessage,
} from '../../src/kafka/kafka.types';

/**
 * Interface for a message stored in the mock Kafka system
 */
interface MockKafkaMessage<T = any> {
  topic: string;
  partition: number;
  offset: number;
  key?: string;
  value: T;
  headers?: KafkaHeaders;
  timestamp: string;
}

/**
 * Interface for a consumer subscription in the mock Kafka system
 */
interface MockConsumerSubscription {
  topic: string;
  groupId: string;
  callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>;
  options?: IKafkaConsumerOptions;
  isActive: boolean;
  lastProcessedOffset?: number;
}

/**
 * Interface for retry configuration in the mock Kafka system
 */
interface MockRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  policy: RetryPolicy;
}

/**
 * Interface for a message in the dead letter queue
 */
interface DeadLetterQueueMessage {
  originalTopic: string;
  message: any;
  error: Error;
  metadata: Record<string, any>;
  timestamp: string;
  retryCount: number;
}

/**
 * Interface for an event in the audit log
 */
interface AuditLogEvent {
  eventType: 'PRODUCE' | 'CONSUME' | 'ERROR' | 'RETRY' | 'DEAD_LETTER';
  topic: string;
  messageId?: string;
  timestamp: string;
  details: Record<string, any>;
}

/**
 * Mock implementation of Kafka client for testing purposes.
 * Simulates Kafka behavior without requiring a real Kafka connection.
 */
export class KafkaTestClient implements IKafkaService {
  private topics: Map<string, Map<number, MockKafkaMessage[]>> = new Map();
  private consumers: Map<string, MockConsumerSubscription[]> = new Map();
  private deadLetterQueue: Map<string, DeadLetterQueueMessage[]> = new Map();
  private auditLog: AuditLogEvent[] = [];
  private eventEmitter = new EventEmitter();
  private autoIncrementOffset: Map<string, Map<number, number>> = new Map();
  private processingDelayMs: number = 0;
  private errorProbability: number = 0;
  private partitionsPerTopic: number = 3; // Default number of partitions
  private defaultRetryConfig: MockRetryConfig = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffFactor: 2,
    policy: RetryPolicy.EXPONENTIAL,
  };

  /**
   * Creates a new instance of KafkaTestClient
   * @param options Configuration options for the test client
   */
  constructor(options?: {
    processingDelayMs?: number;
    errorProbability?: number;
    partitionsPerTopic?: number;
    retryConfig?: Partial<MockRetryConfig>;
  }) {
    if (options) {
      this.processingDelayMs = options.processingDelayMs ?? this.processingDelayMs;
      this.errorProbability = options.errorProbability ?? this.errorProbability;
      this.partitionsPerTopic = options.partitionsPerTopic ?? this.partitionsPerTopic;
      
      if (options.retryConfig) {
        this.defaultRetryConfig = {
          ...this.defaultRetryConfig,
          ...options.retryConfig,
        };
      }
    }

    // Set up max listeners to avoid memory leak warnings in tests
    this.eventEmitter.setMaxListeners(100);
  }

  /**
   * Produces a message to a Kafka topic
   * @param topic The topic to produce to
   * @param message The message to produce
   * @param key Optional message key for partitioning
   * @param headers Optional message headers
   * @param options Optional producer options
   */
  async produce(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>,
    options?: IKafkaProducerOptions
  ): Promise<void> {
    // Create topic and partitions if they don't exist
    this.ensureTopicExists(topic);

    // Validate message if validator is provided
    if (options?.validator) {
      const validationResult = await options.validator(message);
      if (!validationResult.isValid) {
        const error = new Error(`Message validation failed: ${validationResult.error}`);
        this.logEvent('ERROR', topic, undefined, { error: error.message, message });
        throw error;
      }
    }

    // Determine partition based on key or round-robin
    const partition = key 
      ? this.getPartitionForKey(key, topic) 
      : this.getNextPartition(topic);

    // Get next offset for this topic-partition
    const offset = this.getNextOffset(topic, partition);

    // Create the message
    const kafkaMessage: MockKafkaMessage = {
      topic,
      partition,
      offset,
      key,
      value: message,
      headers: headers as KafkaHeaders,
      timestamp: new Date().toISOString(),
    };

    // Store the message
    const partitions = this.topics.get(topic)!;
    const messages = partitions.get(partition)!;
    messages.push(kafkaMessage);

    // Log the produce event
    const messageId = headers?.['event-id'] || uuidv4();
    this.logEvent('PRODUCE', topic, messageId, { partition, offset, message });

    // Emit event for any active consumers
    setTimeout(() => {
      this.eventEmitter.emit(`${topic}-${partition}`, kafkaMessage);
    }, this.processingDelayMs);
  }

  /**
   * Produces a batch of messages to a Kafka topic
   * @param topic The topic to produce to
   * @param messages The messages to produce
   * @param options Optional producer options
   */
  async produceBatch(
    topic: string,
    messages: Array<{ value: any; key?: string; headers?: Record<string, string> }>,
    options?: IKafkaProducerOptions
  ): Promise<void> {
    for (const message of messages) {
      await this.produce(topic, message.value, message.key, message.headers, options);
    }
  }

  /**
   * Consumes messages from a Kafka topic
   * @param topic The topic to consume from
   * @param groupId The consumer group ID
   * @param callback The callback to invoke for each message
   * @param options Optional consumer options
   */
  async consume(
    topic: string,
    groupId: string | undefined,
    callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>,
    options?: IKafkaConsumerOptions
  ): Promise<void> {
    // Create topic if it doesn't exist
    this.ensureTopicExists(topic);

    // Create consumer group if it doesn't exist
    if (!this.consumers.has(topic)) {
      this.consumers.set(topic, []);
    }

    // Create consumer subscription
    const subscription: MockConsumerSubscription = {
      topic,
      groupId: groupId || 'default-group',
      callback,
      options,
      isActive: true,
    };

    // Add subscription to consumer group
    this.consumers.get(topic)!.push(subscription);

    // Set up listener for new messages
    for (let partition = 0; partition < this.partitionsPerTopic; partition++) {
      this.setupConsumerListener(subscription, partition);
    }

    // Process existing messages if fromBeginning is true
    if (options?.fromBeginning) {
      const partitions = this.topics.get(topic);
      if (partitions) {
        for (let partition = 0; partition < this.partitionsPerTopic; partition++) {
          const messages = partitions.get(partition) || [];
          for (const message of messages) {
            await this.processMessage(message, subscription);
          }
        }
      }
    }
  }

  /**
   * Consumes messages from a retry topic
   * @param originalTopic The original topic
   * @param groupId The consumer group ID
   * @param callback The callback to invoke for each message
   * @param options Optional consumer options
   */
  async consumeRetry(
    originalTopic: string,
    groupId: string | undefined,
    callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>,
    options?: IKafkaConsumerOptions
  ): Promise<void> {
    const retryTopic = `${originalTopic}.retry`;
    await this.consume(retryTopic, groupId, callback, options);
  }

  /**
   * Consumes messages from a dead letter queue
   * @param originalTopic The original topic
   * @param groupId The consumer group ID
   * @param callback The callback to invoke for each message
   * @param options Optional consumer options
   */
  async consumeDeadLetterQueue(
    originalTopic: string,
    groupId: string | undefined,
    callback: (message: any, error: any, metadata: any) => Promise<void>,
    options?: IKafkaConsumerOptions
  ): Promise<void> {
    const dlqTopic = `${originalTopic}.dlq`;
    
    // Create DLQ topic if it doesn't exist
    this.ensureTopicExists(dlqTopic);

    // Create consumer group if it doesn't exist
    if (!this.consumers.has(dlqTopic)) {
      this.consumers.set(dlqTopic, []);
    }

    // Create consumer subscription with special DLQ handling
    const subscription: MockConsumerSubscription = {
      topic: dlqTopic,
      groupId: groupId || 'dlq-group',
      callback: async (message: any, key?: string, headers?: Record<string, string>) => {
        // Extract error and metadata from DLQ message
        const dlqMessage = message as DeadLetterQueueMessage;
        await callback(dlqMessage.message, dlqMessage.error, dlqMessage.metadata);
      },
      options,
      isActive: true,
    };

    // Add subscription to consumer group
    this.consumers.get(dlqTopic)!.push(subscription);

    // Set up listener for new messages
    for (let partition = 0; partition < this.partitionsPerTopic; partition++) {
      this.setupConsumerListener(subscription, partition);
    }

    // Process existing DLQ messages if fromBeginning is true
    if (options?.fromBeginning && this.deadLetterQueue.has(originalTopic)) {
      const dlqMessages = this.deadLetterQueue.get(originalTopic) || [];
      for (const dlqMessage of dlqMessages) {
        await subscription.callback(dlqMessage, undefined, undefined);
      }
    }
  }

  /**
   * Sends a message to the dead letter queue
   * @param originalTopic The original topic
   * @param message The message
   * @param error The error that occurred
   * @param metadata Additional metadata
   * @param config Optional DLQ configuration
   */
  async sendToDeadLetterQueue(
    originalTopic: string,
    message: any,
    error: Error,
    metadata?: Record<string, any>,
    config?: IKafkaDeadLetterQueueConfig
  ): Promise<void> {
    // Create DLQ for topic if it doesn't exist
    if (!this.deadLetterQueue.has(originalTopic)) {
      this.deadLetterQueue.set(originalTopic, []);
    }

    // Create DLQ message
    const dlqMessage: DeadLetterQueueMessage = {
      originalTopic,
      message,
      error,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      retryCount: metadata?.retryCount || 0,
    };

    // Add to DLQ
    this.deadLetterQueue.get(originalTopic)!.push(dlqMessage);

    // Log the DLQ event
    this.logEvent('DEAD_LETTER', originalTopic, metadata?.messageId, {
      error: error.message,
      retryCount: dlqMessage.retryCount,
    });

    // If retry is enabled, schedule retry after backoff
    if (config?.retryEnabled && dlqMessage.retryCount < (config?.maxRetries || this.defaultRetryConfig.maxRetries)) {
      const retryTopic = config?.retryTopic || `${originalTopic}.retry`;
      const retryCount = dlqMessage.retryCount + 1;
      const retryDelay = this.calculateBackoff(retryCount, config);

      // Schedule retry
      setTimeout(async () => {
        try {
          // Update retry count in metadata
          const retryMetadata = {
            ...metadata,
            retryCount,
            originalTopic,
          };

          // Add retry headers
          const headers = {
            ...(message.headers || {}),
            'retry-count': retryCount.toString(),
            'original-topic': originalTopic,
          };

          // Produce to retry topic
          await this.produce(retryTopic, message, message.key, headers);

          // Log retry event
          this.logEvent('RETRY', retryTopic, metadata?.messageId, {
            retryCount,
            originalTopic,
            delay: retryDelay,
          });
        } catch (retryError) {
          console.error('Error during retry:', retryError);
        }
      }, retryDelay);
    }

    // Also produce to DLQ topic for consumers
    const dlqTopic = `${originalTopic}.dlq`;
    this.ensureTopicExists(dlqTopic);
    
    // Determine partition (use 0 for simplicity in DLQ)
    const partition = 0;
    
    // Get next offset
    const offset = this.getNextOffset(dlqTopic, partition);
    
    // Create Kafka message
    const kafkaMessage: MockKafkaMessage = {
      topic: dlqTopic,
      partition,
      offset,
      value: dlqMessage,
      timestamp: dlqMessage.timestamp,
    };
    
    // Store the message
    const partitions = this.topics.get(dlqTopic)!;
    const messages = partitions.get(partition)!;
    messages.push(kafkaMessage);
    
    // Emit event for any active consumers
    setTimeout(() => {
      this.eventEmitter.emit(`${dlqTopic}-${partition}`, kafkaMessage);
    }, this.processingDelayMs);
  }

  /**
   * Pauses consumption for a specific topic and group
   * @param topic The topic
   * @param groupId The consumer group ID
   */
  pauseConsumption(topic: string, groupId?: string): void {
    const subscriptions = this.consumers.get(topic) || [];
    for (const subscription of subscriptions) {
      if (!groupId || subscription.groupId === groupId) {
        subscription.isActive = false;
      }
    }
  }

  /**
   * Resumes consumption for a specific topic and group
   * @param topic The topic
   * @param groupId The consumer group ID
   */
  resumeConsumption(topic: string, groupId?: string): void {
    const subscriptions = this.consumers.get(topic) || [];
    for (const subscription of subscriptions) {
      if (!groupId || subscription.groupId === groupId) {
        subscription.isActive = true;
      }
    }
  }

  /**
   * Sets the probability of errors during message processing
   * @param probability Value between 0 and 1
   */
  setErrorProbability(probability: number): void {
    this.errorProbability = Math.max(0, Math.min(1, probability));
  }

  /**
   * Sets the processing delay for message delivery
   * @param delayMs Delay in milliseconds
   */
  setProcessingDelay(delayMs: number): void {
    this.processingDelayMs = delayMs;
  }

  /**
   * Gets all messages for a specific topic
   * @param topic The topic
   * @returns Array of messages
   */
  getMessages(topic: string): MockKafkaMessage[] {
    const partitions = this.topics.get(topic);
    if (!partitions) return [];

    const messages: MockKafkaMessage[] = [];
    for (const partition of partitions.values()) {
      messages.push(...partition);
    }

    // Sort by offset for consistent ordering
    return messages.sort((a, b) => a.offset - b.offset);
  }

  /**
   * Gets all messages in the dead letter queue for a topic
   * @param topic The topic
   * @returns Array of DLQ messages
   */
  getDeadLetterQueueMessages(topic: string): DeadLetterQueueMessage[] {
    return this.deadLetterQueue.get(topic) || [];
  }

  /**
   * Gets the audit log for all operations
   * @returns Array of audit log events
   */
  getAuditLog(): AuditLogEvent[] {
    return [...this.auditLog];
  }

  /**
   * Clears all topics, consumers, and logs
   */
  reset(): void {
    this.topics.clear();
    this.consumers.clear();
    this.deadLetterQueue.clear();
    this.auditLog = [];
    this.autoIncrementOffset.clear();
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Verifies that messages were produced to a topic in the expected order
   * @param topic The topic
   * @param expectedMessages The expected messages
   * @returns True if the messages match
   */
  verifyMessages(topic: string, expectedMessages: any[]): boolean {
    const messages = this.getMessages(topic);
    if (messages.length !== expectedMessages.length) return false;

    return expectedMessages.every((expected, index) => {
      const actual = messages[index].value;
      return JSON.stringify(actual) === JSON.stringify(expected);
    });
  }

  /**
   * Verifies that a specific number of messages were produced to a topic
   * @param topic The topic
   * @param count The expected count
   * @returns True if the count matches
   */
  verifyMessageCount(topic: string, count: number): boolean {
    const messages = this.getMessages(topic);
    return messages.length === count;
  }

  /**
   * Verifies that a specific number of messages were sent to the dead letter queue
   * @param topic The topic
   * @param count The expected count
   * @returns True if the count matches
   */
  verifyDeadLetterCount(topic: string, count: number): boolean {
    const dlqMessages = this.getDeadLetterQueueMessages(topic);
    return dlqMessages.length === count;
  }

  /**
   * Verifies that a specific error was recorded in the audit log
   * @param topic The topic
   * @param errorMessage The expected error message (partial match)
   * @returns True if the error was found
   */
  verifyErrorLogged(topic: string, errorMessage: string): boolean {
    return this.auditLog.some(
      (event) =>
        event.eventType === 'ERROR' &&
        event.topic === topic &&
        event.details.error?.includes(errorMessage)
    );
  }

  /**
   * Verifies that retries were attempted for a message
   * @param topic The topic
   * @param messageId The message ID
   * @param minRetries The minimum number of retries expected
   * @returns True if the retry count meets or exceeds the minimum
   */
  verifyRetryAttempts(topic: string, messageId: string, minRetries: number): boolean {
    const retryEvents = this.auditLog.filter(
      (event) =>
        event.eventType === 'RETRY' &&
        event.messageId === messageId
    );
    return retryEvents.length >= minRetries;
  }

  /**
   * Ensures a topic exists with the specified number of partitions
   * @param topic The topic name
   */
  private ensureTopicExists(topic: string): void {
    if (!this.topics.has(topic)) {
      const partitions = new Map<number, MockKafkaMessage[]>();
      for (let i = 0; i < this.partitionsPerTopic; i++) {
        partitions.set(i, []);
      }
      this.topics.set(topic, partitions);
    }

    if (!this.autoIncrementOffset.has(topic)) {
      const offsets = new Map<number, number>();
      for (let i = 0; i < this.partitionsPerTopic; i++) {
        offsets.set(i, 0);
      }
      this.autoIncrementOffset.set(topic, offsets);
    }
  }

  /**
   * Gets the next offset for a topic-partition
   * @param topic The topic
   * @param partition The partition
   * @returns The next offset
   */
  private getNextOffset(topic: string, partition: number): number {
    const topicOffsets = this.autoIncrementOffset.get(topic)!;
    const currentOffset = topicOffsets.get(partition) || 0;
    const nextOffset = currentOffset + 1;
    topicOffsets.set(partition, nextOffset);
    return currentOffset;
  }

  /**
   * Gets the partition for a key using consistent hashing
   * @param key The message key
   * @param topic The topic
   * @returns The partition number
   */
  private getPartitionForKey(key: string, topic: string): number {
    // Simple hash function for consistent partitioning
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const partitionCount = this.topics.get(topic)!.size;
    return Math.abs(hash) % partitionCount;
  }

  /**
   * Gets the next partition in round-robin fashion
   * @param topic The topic
   * @returns The partition number
   */
  private getNextPartition(topic: string): number {
    const partitionCount = this.topics.get(topic)!.size;
    const offsets = this.autoIncrementOffset.get(topic)!;
    let maxOffset = -1;
    let selectedPartition = 0;

    // Find partition with lowest offset (round-robin)
    for (let i = 0; i < partitionCount; i++) {
      const offset = offsets.get(i) || 0;
      if (maxOffset === -1 || offset < maxOffset) {
        maxOffset = offset;
        selectedPartition = i;
      }
    }

    return selectedPartition;
  }

  /**
   * Sets up a listener for a consumer subscription on a specific partition
   * @param subscription The consumer subscription
   * @param partition The partition number
   */
  private setupConsumerListener(
    subscription: MockConsumerSubscription,
    partition: number
  ): void {
    const { topic } = subscription;
    const eventName = `${topic}-${partition}`;

    this.eventEmitter.on(eventName, async (message: MockKafkaMessage) => {
      if (subscription.isActive) {
        await this.processMessage(message, subscription);
      }
    });
  }

  /**
   * Processes a message for a consumer subscription
   * @param message The Kafka message
   * @param subscription The consumer subscription
   */
  private async processMessage(
    message: MockKafkaMessage,
    subscription: MockConsumerSubscription
  ): Promise<void> {
    const { topic, callback, options } = subscription;

    try {
      // Validate message if validator is provided
      if (options?.validator) {
        const validationResult = await options.validator(message.value);
        if (!validationResult.isValid) {
          throw new Error(`Message validation failed: ${validationResult.error}`);
        }
      }

      // Simulate random errors based on probability
      if (this.errorProbability > 0 && Math.random() < this.errorProbability) {
        throw new Error('Simulated random error during message processing');
      }

      // Process message
      const messageId = message.headers?.['event-id'] || uuidv4();
      this.logEvent('CONSUME', topic, messageId, {
        partition: message.partition,
        offset: message.offset,
        groupId: subscription.groupId,
      });

      // Call the consumer callback
      await callback(message.value, message.key, message.headers as Record<string, string>);

      // Update last processed offset
      subscription.lastProcessedOffset = message.offset;
    } catch (error) {
      // Log error
      const messageId = message.headers?.['event-id'] || uuidv4();
      this.logEvent('ERROR', topic, messageId, {
        error: error.message,
        partition: message.partition,
        offset: message.offset,
        groupId: subscription.groupId,
      });

      // Handle error based on DLQ configuration
      if (options?.deadLetterQueue?.enabled) {
        await this.sendToDeadLetterQueue(
          topic,
          message.value,
          error as Error,
          {
            messageId,
            partition: message.partition,
            offset: message.offset,
            groupId: subscription.groupId,
          },
          options.deadLetterQueue
        );
      } else {
        // Re-throw if DLQ is not enabled
        throw error;
      }
    }
  }

  /**
   * Calculates the backoff delay for retries using exponential backoff
   * @param retryCount The current retry count
   * @param config Optional DLQ configuration
   * @returns The delay in milliseconds
   */
  private calculateBackoff(
    retryCount: number,
    config?: IKafkaDeadLetterQueueConfig
  ): number {
    const baseDelay = config?.baseBackoffMs || this.defaultRetryConfig.initialDelayMs;
    const maxDelay = config?.maxBackoffMs || this.defaultRetryConfig.maxDelayMs;
    const factor = this.defaultRetryConfig.backoffFactor;

    // Calculate exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(factor, retryCount - 1);
    const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
    const delay = Math.min(exponentialDelay * jitter, maxDelay);

    return Math.floor(delay);
  }

  /**
   * Logs an event to the audit log
   * @param eventType The event type
   * @param topic The topic
   * @param messageId Optional message ID
   * @param details Additional details
   */
  private logEvent(
    eventType: AuditLogEvent['eventType'],
    topic: string,
    messageId?: string,
    details: Record<string, any> = {}
  ): void {
    this.auditLog.push({
      eventType,
      topic,
      messageId,
      timestamp: new Date().toISOString(),
      details,
    });
  }
}

/**
 * Factory function to create a KafkaTestClient with default configuration
 * @returns A configured KafkaTestClient instance
 */
export function createKafkaTestClient(options?: {
  processingDelayMs?: number;
  errorProbability?: number;
  partitionsPerTopic?: number;
  retryConfig?: Partial<MockRetryConfig>;
}): KafkaTestClient {
  return new KafkaTestClient(options);
}

/**
 * Creates a mock validation result
 * @param isValid Whether the validation passed
 * @param error Optional error message
 * @returns A validation result object
 */
export function createMockValidationResult(isValid: boolean, error?: string): IValidationResult {
  return { isValid, error };
}

/**
 * Creates mock Kafka headers
 * @param options Header options
 * @returns Kafka headers object
 */
export function createMockKafkaHeaders(options?: {
  eventId?: string;
  correlationId?: string;
  traceId?: string;
  userId?: string;
  eventType?: string;
  eventVersion?: string;
  journey?: EventJourney;
  source?: string;
  timestamp?: string;
  retryCount?: number;
}): KafkaHeaders {
  const headers: KafkaHeaders = {};
  
  if (options) {
    if (options.eventId) headers['event-id'] = options.eventId;
    if (options.correlationId) headers['correlation-id'] = options.correlationId;
    if (options.traceId) headers['trace-id'] = options.traceId;
    if (options.userId) headers['user-id'] = options.userId;
    if (options.eventType) headers['event-type'] = options.eventType;
    if (options.eventVersion) headers['event-version'] = options.eventVersion;
    if (options.journey) headers['event-journey'] = options.journey;
    if (options.source) headers['event-source'] = options.source;
    if (options.timestamp) headers['event-timestamp'] = options.timestamp;
    if (options.retryCount !== undefined) headers['retry-count'] = options.retryCount.toString();
  }
  
  return headers;
}

/**
 * Creates a mock Kafka message
 * @param value The message value
 * @param options Additional message options
 * @returns A typed Kafka message
 */
export function createMockKafkaMessage<T>(
  value: T,
  options?: {
    key?: string;
    headers?: KafkaHeaders;
    partition?: number;
    offset?: number;
    timestamp?: string;
  }
): TypedKafkaMessage<T> {
  return {
    key: options?.key ? Buffer.from(options.key) : null,
    value,
    headers: options?.headers,
    partition: options?.partition || 0,
    offset: options?.offset ? BigInt(options.offset) : BigInt(0),
    timestamp: options?.timestamp || new Date().toISOString(),
  };
}
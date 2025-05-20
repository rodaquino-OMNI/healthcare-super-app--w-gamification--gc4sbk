/**
 * @file mock-event-broker.ts
 * @description Implements a complete in-memory event broker that simulates the publish/subscribe pattern
 * for testing event-driven communication between services. This mock supports topics, subscriptions,
 * and message routing without requiring an actual Kafka instance, making it ideal for integration testing
 * of event-producing and consuming services.
 *
 * Features:
 * - Topic-based routing with support for partitions
 * - Consumer groups with load balancing
 * - Message headers and metadata handling
 * - Delivery tracking for test verification
 * - Broker downtime simulation
 * - Retry mechanism simulation
 * - Dead-letter queue support
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { EventMetadataDto } from '../../src/dto/event-metadata.dto';
import { KafkaMessage } from '../../src/interfaces/kafka-message.interface';

/**
 * Interface for a message in the mock event broker.
 */
export interface MockMessage<T = any> {
  /**
   * The message value/payload.
   */
  value: T;

  /**
   * Optional message key for partitioning.
   */
  key?: string;

  /**
   * Message headers as key-value pairs.
   */
  headers: Record<string, string>;

  /**
   * Topic the message was published to.
   */
  topic: string;

  /**
   * Partition the message was assigned to.
   */
  partition: number;

  /**
   * Offset of the message in the partition.
   */
  offset: string;

  /**
   * Timestamp when the message was published.
   */
  timestamp: string;

  /**
   * Number of delivery attempts.
   */
  deliveryAttempts: number;
}

/**
 * Options for subscribing to a topic.
 */
export interface SubscriptionOptions {
  /**
   * Consumer group ID for load balancing.
   */
  groupId?: string;

  /**
   * Whether to receive messages from the beginning of the topic.
   */
  fromBeginning?: boolean;

  /**
   * Maximum number of retry attempts for failed message processing.
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds between retry attempts.
   */
  retryDelay?: number;

  /**
   * Whether to send failed messages to the dead-letter queue.
   */
  useDLQ?: boolean;

  /**
   * Number of partitions to consume from (defaults to all).
   */
  partitions?: number[];
}

/**
 * Options for publishing a message.
 */
export interface PublishOptions {
  /**
   * Compression type (not actually used in mock, for API compatibility).
   */
  compression?: string;

  /**
   * Number of acknowledgments required (not actually used in mock, for API compatibility).
   */
  acks?: number;

  /**
   * Timeout in milliseconds (not actually used in mock, for API compatibility).
   */
  timeout?: number;

  /**
   * Specific partition to publish to (if not provided, one will be selected based on key).
   */
  partition?: number;
}

/**
 * Callback function for processing a message.
 */
export type MessageHandler<T = any> = (
  message: T,
  metadata: KafkaMessage
) => Promise<void>;

/**
 * Represents a subscription to a topic.
 */
interface Subscription<T = any> {
  /**
   * Topic being subscribed to.
   */
  topic: string;

  /**
   * Consumer group ID.
   */
  groupId: string;

  /**
   * Callback function for processing messages.
   */
  handler: MessageHandler<T>;

  /**
   * Whether to receive messages from the beginning of the topic.
   */
  fromBeginning: boolean;

  /**
   * Maximum number of retry attempts for failed message processing.
   */
  maxRetries: number;

  /**
   * Base delay in milliseconds between retry attempts.
   */
  retryDelay: number;

  /**
   * Whether to send failed messages to the dead-letter queue.
   */
  useDLQ: boolean;

  /**
   * Partitions to consume from.
   */
  partitions?: number[];

  /**
   * Whether the subscription is active.
   */
  active: boolean;
}

/**
 * Represents a topic in the mock event broker.
 */
interface Topic {
  /**
   * Name of the topic.
   */
  name: string;

  /**
   * Number of partitions in the topic.
   */
  partitions: number;

  /**
   * Messages in each partition.
   */
  messages: MockMessage[][];

  /**
   * Current offset for each partition.
   */
  offsets: number[];

  /**
   * Consumer group offsets for each partition.
   */
  consumerOffsets: Map<string, number[]>;
}

/**
 * Represents a delivery record for tracking message delivery in tests.
 */
export interface DeliveryRecord<T = any> {
  /**
   * The message that was delivered.
   */
  message: MockMessage<T>;

  /**
   * Timestamp when the message was delivered.
   */
  deliveredAt: Date;

  /**
   * Consumer group that received the message.
   */
  consumerGroup: string;

  /**
   * Whether the message was successfully processed.
   */
  success: boolean;

  /**
   * Error that occurred during processing, if any.
   */
  error?: Error;

  /**
   * Number of retry attempts made.
   */
  retryCount: number;
}

/**
 * Mock implementation of an event broker for testing event-driven communication.
 */
export class MockEventBroker {
  /**
   * Map of topic names to topic objects.
   */
  private topics: Map<string, Topic> = new Map();

  /**
   * Map of topic names to subscriptions.
   */
  private subscriptions: Map<string, Subscription[]> = new Map();

  /**
   * Event emitter for internal event handling.
   */
  private eventEmitter: EventEmitter = new EventEmitter();

  /**
   * Records of all message deliveries for test verification.
   */
  private deliveryRecords: DeliveryRecord[] = [];

  /**
   * Whether the broker is currently available.
   */
  private available: boolean = true;

  /**
   * Default dead-letter queue topic name.
   */
  private readonly deadLetterTopic: string = 'dead-letter';

  /**
   * Default number of partitions per topic.
   */
  private readonly defaultPartitions: number = 3;

  /**
   * Creates a new MockEventBroker instance.
   * 
   * @param options Configuration options
   */
  constructor(options?: {
    deadLetterTopic?: string;
    defaultPartitions?: number;
  }) {
    if (options?.deadLetterTopic) {
      this.deadLetterTopic = options.deadLetterTopic;
    }

    if (options?.defaultPartitions) {
      this.defaultPartitions = options.defaultPartitions;
    }

    // Create the dead-letter queue topic
    this.createTopic(this.deadLetterTopic, 1);

    // Set maximum event listeners to avoid memory leak warnings
    this.eventEmitter.setMaxListeners(100);
  }

  /**
   * Creates a topic if it doesn't exist.
   * 
   * @param topicName Name of the topic to create
   * @param partitions Number of partitions (defaults to defaultPartitions)
   * @returns The created or existing topic
   */
  public createTopic(topicName: string, partitions: number = this.defaultPartitions): Topic {
    if (!this.topics.has(topicName)) {
      const topic: Topic = {
        name: topicName,
        partitions,
        messages: Array(partitions).fill(null).map(() => []),
        offsets: Array(partitions).fill(0),
        consumerOffsets: new Map(),
      };
      this.topics.set(topicName, topic);
      return topic;
    }
    return this.topics.get(topicName)!;
  }

  /**
   * Publishes a message to a topic.
   * 
   * @param topic Topic to publish to
   * @param message Message payload
   * @param key Optional message key for partitioning
   * @param headers Optional message headers
   * @param options Optional publishing options
   * @returns Promise that resolves when the message is published
   */
  public async publish<T = any>(
    topic: string,
    message: T,
    key?: string,
    headers: Record<string, string> = {},
    options: PublishOptions = {}
  ): Promise<void> {
    if (!this.available) {
      throw new Error('Broker is not available');
    }

    // Create topic if it doesn't exist
    const topicObj = this.createTopic(topic);

    // Add metadata if not present
    let enrichedMessage = message;
    if (message && typeof message === 'object' && !this.hasMetadata(message)) {
      enrichedMessage = this.addMetadata(message as any);
    }

    // Determine partition
    let partition: number;
    if (options.partition !== undefined && options.partition < topicObj.partitions) {
      partition = options.partition;
    } else if (key) {
      // Consistent hashing for keys
      partition = this.getPartitionForKey(key, topicObj.partitions);
    } else {
      // Round-robin for messages without keys
      partition = Math.floor(Math.random() * topicObj.partitions);
    }

    // Create message object
    const offset = topicObj.offsets[partition]++;
    const mockMessage: MockMessage<T> = {
      value: enrichedMessage,
      key,
      headers,
      topic,
      partition,
      offset: offset.toString(),
      timestamp: Date.now().toString(),
      deliveryAttempts: 0,
    };

    // Store message in topic partition
    topicObj.messages[partition].push(mockMessage);

    // Emit message event for subscribers
    setImmediate(() => {
      this.eventEmitter.emit(`message:${topic}`, mockMessage);
    });
  }

  /**
   * Publishes multiple messages to a topic in a batch.
   * 
   * @param topic Topic to publish to
   * @param messages Array of messages with optional keys and headers
   * @param options Optional publishing options
   * @returns Promise that resolves when all messages are published
   */
  public async publishBatch<T = any>(
    topic: string,
    messages: Array<{
      value: T;
      key?: string;
      headers?: Record<string, string>;
    }>,
    options: PublishOptions = {}
  ): Promise<void> {
    if (!this.available) {
      throw new Error('Broker is not available');
    }

    // Publish each message individually
    for (const msg of messages) {
      await this.publish(
        topic,
        msg.value,
        msg.key,
        msg.headers || {},
        options
      );
    }
  }

  /**
   * Subscribes to a topic and processes messages with the provided handler.
   * 
   * @param topic Topic to subscribe to
   * @param handler Function to process each message
   * @param options Subscription options
   * @returns Promise that resolves when the subscription is established
   */
  public async subscribe<T = any>(
    topic: string,
    handler: MessageHandler<T>,
    options: SubscriptionOptions = {}
  ): Promise<void> {
    if (!this.available) {
      throw new Error('Broker is not available');
    }

    // Create topic if it doesn't exist
    const topicObj = this.createTopic(topic);

    // Set default options
    const groupId = options.groupId || 'default-group';
    const fromBeginning = options.fromBeginning || false;
    const maxRetries = options.maxRetries ?? 3;
    const retryDelay = options.retryDelay ?? 100;
    const useDLQ = options.useDLQ ?? true;

    // Create subscription
    const subscription: Subscription<T> = {
      topic,
      groupId,
      handler,
      fromBeginning,
      maxRetries,
      retryDelay,
      useDLQ,
      partitions: options.partitions,
      active: true,
    };

    // Add subscription to topic
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic)!.push(subscription);

    // Initialize consumer offsets for this group if not already done
    if (!topicObj.consumerOffsets.has(groupId)) {
      const initialOffsets = Array(topicObj.partitions).fill(fromBeginning ? 0 : topicObj.offsets.slice());
      topicObj.consumerOffsets.set(groupId, initialOffsets);
    }

    // Set up message listener
    this.eventEmitter.on(`message:${topic}`, async (message: MockMessage<T>) => {
      // Skip if subscription is not active
      if (!subscription.active) {
        return;
      }

      // Skip if message is for a partition we're not subscribed to
      if (
        subscription.partitions &&
        !subscription.partitions.includes(message.partition)
      ) {
        return;
      }

      // Skip if message offset is less than consumer offset
      const consumerOffsets = topicObj.consumerOffsets.get(groupId)!;
      if (parseInt(message.offset) < consumerOffsets[message.partition]) {
        return;
      }

      // Process message
      await this.processMessage(message, subscription);

      // Update consumer offset
      consumerOffsets[message.partition] = parseInt(message.offset) + 1;
    });

    // Process existing messages if fromBeginning is true
    if (fromBeginning) {
      const partitionsToProcess = subscription.partitions || 
        Array.from({ length: topicObj.partitions }, (_, i) => i);

      for (const partition of partitionsToProcess) {
        const messages = topicObj.messages[partition];
        const consumerOffsets = topicObj.consumerOffsets.get(groupId)!;
        const startOffset = consumerOffsets[partition];

        for (let i = startOffset; i < messages.length; i++) {
          const message = messages[i];
          await this.processMessage(message, subscription);
          consumerOffsets[partition] = i + 1;
        }
      }
    }
  }

  /**
   * Processes a message with the subscription handler and handles retries.
   * 
   * @param message Message to process
   * @param subscription Subscription that should process the message
   * @private
   */
  private async processMessage<T = any>(
    message: MockMessage<T>,
    subscription: Subscription<T>
  ): Promise<void> {
    if (!this.available) {
      return; // Don't process messages when broker is unavailable
    }

    // Increment delivery attempts
    message.deliveryAttempts++;

    // Create metadata for handler
    const metadata: KafkaMessage = {
      key: message.key,
      headers: message.headers,
      topic: message.topic,
      partition: message.partition,
      offset: message.offset,
      timestamp: message.timestamp,
    };

    try {
      // Process message with handler
      await subscription.handler(message.value, metadata);

      // Record successful delivery
      this.recordDelivery({
        message,
        deliveredAt: new Date(),
        consumerGroup: subscription.groupId,
        success: true,
        retryCount: message.deliveryAttempts - 1,
      });
    } catch (error) {
      // Handle processing error
      const retryCount = parseInt(message.headers['retry-count'] || '0', 10);
      const nextRetryCount = retryCount + 1;

      // Record failed delivery
      this.recordDelivery({
        message,
        deliveredAt: new Date(),
        consumerGroup: subscription.groupId,
        success: false,
        error: error as Error,
        retryCount,
      });

      // Retry if under max retries
      if (nextRetryCount <= subscription.maxRetries) {
        // Calculate retry delay with exponential backoff
        const delay = this.calculateRetryDelay(nextRetryCount, subscription.retryDelay);

        // Update retry count in headers
        const updatedHeaders = {
          ...message.headers,
          'retry-count': nextRetryCount.toString(),
        };

        // Schedule retry after delay
        setTimeout(() => {
          if (subscription.active && this.available) {
            // Create a new message for retry
            const retryMessage: MockMessage<T> = {
              ...message,
              headers: updatedHeaders,
              timestamp: Date.now().toString(),
            };

            // Process the retry
            this.processMessage(retryMessage, subscription);
          }
        }, delay);
      } else if (subscription.useDLQ) {
        // Send to dead-letter queue
        await this.sendToDLQ(
          message.topic,
          message.value,
          message.key,
          {
            ...message.headers,
            'error-type': 'processing-failed',
            'error-message': (error as Error).message,
            'retry-count': nextRetryCount.toString(),
            'max-retries': subscription.maxRetries.toString(),
            'source-topic': message.topic,
            'source-partition': message.partition.toString(),
            'dlq-timestamp': Date.now().toString(),
          }
        );
      }
    }
  }

  /**
   * Sends a message to the dead-letter queue.
   * 
   * @param sourceTopic Original topic of the message
   * @param message Message payload
   * @param key Optional message key
   * @param headers Message headers with error context
   * @private
   */
  private async sendToDLQ<T = any>(
    sourceTopic: string,
    message: T,
    key?: string,
    headers: Record<string, string> = {}
  ): Promise<void> {
    try {
      await this.publish(
        this.deadLetterTopic,
        message,
        key,
        headers
      );
    } catch (error) {
      // Don't throw from DLQ publishing to prevent cascading failures
      console.error('Failed to send message to dead-letter queue:', error);
    }
  }

  /**
   * Unsubscribes from a topic.
   * 
   * @param topic Topic to unsubscribe from
   * @param groupId Consumer group ID (if not provided, all groups will be unsubscribed)
   * @returns Promise that resolves when unsubscribed
   */
  public async unsubscribe(topic: string, groupId?: string): Promise<void> {
    if (!this.subscriptions.has(topic)) {
      return;
    }

    const subscriptions = this.subscriptions.get(topic)!;
    
    if (groupId) {
      // Mark subscriptions for this group as inactive
      subscriptions.forEach(sub => {
        if (sub.groupId === groupId) {
          sub.active = false;
        }
      });

      // Remove inactive subscriptions
      this.subscriptions.set(
        topic,
        subscriptions.filter(sub => sub.groupId !== groupId || sub.active)
      );
    } else {
      // Mark all subscriptions for this topic as inactive
      subscriptions.forEach(sub => {
        sub.active = false;
      });

      // Remove all subscriptions for this topic
      this.subscriptions.delete(topic);
    }
  }

  /**
   * Simulates broker downtime.
   * 
   * @param durationMs Duration of downtime in milliseconds
   * @returns Promise that resolves when downtime is over
   */
  public async simulateDowntime(durationMs: number): Promise<void> {
    this.available = false;
    return new Promise(resolve => {
      setTimeout(() => {
        this.available = true;
        resolve();
      }, durationMs);
    });
  }

  /**
   * Simulates a network partition that affects specific consumer groups.
   * 
   * @param groupIds Consumer group IDs affected by the partition
   * @param durationMs Duration of the partition in milliseconds
   * @returns Promise that resolves when the partition is healed
   */
  public async simulateNetworkPartition(
    groupIds: string[],
    durationMs: number
  ): Promise<void> {
    // Deactivate subscriptions for affected groups
    for (const [topic, subscriptions] of this.subscriptions.entries()) {
      subscriptions.forEach(sub => {
        if (groupIds.includes(sub.groupId)) {
          sub.active = false;
        }
      });
    }

    // Reactivate after duration
    return new Promise(resolve => {
      setTimeout(() => {
        for (const [topic, subscriptions] of this.subscriptions.entries()) {
          subscriptions.forEach(sub => {
            if (groupIds.includes(sub.groupId)) {
              sub.active = true;
            }
          });
        }
        resolve();
      }, durationMs);
    });
  }

  /**
   * Gets all messages published to a topic.
   * 
   * @param topic Topic to get messages from
   * @param partition Optional specific partition to get messages from
   * @returns Array of messages
   */
  public getMessages<T = any>(topic: string, partition?: number): MockMessage<T>[] {
    if (!this.topics.has(topic)) {
      return [];
    }

    const topicObj = this.topics.get(topic)!;
    
    if (partition !== undefined) {
      if (partition >= 0 && partition < topicObj.partitions) {
        return [...topicObj.messages[partition]] as MockMessage<T>[];
      }
      return [];
    }

    // Flatten all partitions
    return topicObj.messages.flat() as MockMessage<T>[];
  }

  /**
   * Gets all delivery records for test verification.
   * 
   * @param filters Optional filters to apply
   * @returns Array of delivery records
   */
  public getDeliveryRecords<T = any>(filters?: {
    topic?: string;
    consumerGroup?: string;
    success?: boolean;
    afterTimestamp?: number;
  }): DeliveryRecord<T>[] {
    let records = [...this.deliveryRecords] as DeliveryRecord<T>[];

    if (filters) {
      if (filters.topic) {
        records = records.filter(record => record.message.topic === filters.topic);
      }

      if (filters.consumerGroup) {
        records = records.filter(record => record.consumerGroup === filters.consumerGroup);
      }

      if (filters.success !== undefined) {
        records = records.filter(record => record.success === filters.success);
      }

      if (filters.afterTimestamp) {
        records = records.filter(record => record.deliveredAt.getTime() > filters.afterTimestamp!);
      }
    }

    return records;
  }

  /**
   * Clears all delivery records.
   */
  public clearDeliveryRecords(): void {
    this.deliveryRecords = [];
  }

  /**
   * Resets the broker to its initial state.
   */
  public reset(): void {
    // Clear all topics except dead-letter queue
    const dlqTopic = this.topics.get(this.deadLetterTopic);
    this.topics.clear();
    if (dlqTopic) {
      this.topics.set(this.deadLetterTopic, {
        ...dlqTopic,
        messages: Array(dlqTopic.partitions).fill(null).map(() => []),
        offsets: Array(dlqTopic.partitions).fill(0),
        consumerOffsets: new Map(),
      });
    } else {
      this.createTopic(this.deadLetterTopic, 1);
    }

    // Clear all subscriptions
    this.subscriptions.clear();

    // Clear all delivery records
    this.clearDeliveryRecords();

    // Reset availability
    this.available = true;

    // Remove all listeners
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Records a message delivery for test verification.
   * 
   * @param record Delivery record to add
   * @private
   */
  private recordDelivery(record: DeliveryRecord): void {
    this.deliveryRecords.push(record);
  }

  /**
   * Calculates retry delay with exponential backoff and jitter.
   * 
   * @param attempt Retry attempt number
   * @param baseDelay Base delay in milliseconds
   * @returns Calculated delay in milliseconds
   * @private
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const maxDelay = Math.min(exponentialDelay, 30000); // Cap at 30 seconds
    
    // Add jitter to prevent thundering herd problem
    return Math.floor(maxDelay * (0.8 + Math.random() * 0.4));
  }

  /**
   * Determines the partition for a message key using consistent hashing.
   * 
   * @param key Message key
   * @param numPartitions Number of partitions
   * @returns Partition number
   * @private
   */
  private getPartitionForKey(key: string, numPartitions: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash) % numPartitions;
  }

  /**
   * Checks if a message already has metadata attached.
   * 
   * @param message Message to check
   * @returns Whether the message has metadata
   * @private
   */
  private hasMetadata(message: any): boolean {
    return message && 
           typeof message === 'object' && 
           message.metadata instanceof EventMetadataDto;
  }

  /**
   * Adds standard metadata to a message.
   * 
   * @param message Message to add metadata to
   * @returns Message with metadata
   * @private
   */
  private addMetadata<T = any>(message: T): T & { metadata: EventMetadataDto } {
    const metadata = new EventMetadataDto();
    metadata.timestamp = new Date();
    metadata.eventId = uuidv4();
    
    return {
      ...message as any,
      metadata
    };
  }
}
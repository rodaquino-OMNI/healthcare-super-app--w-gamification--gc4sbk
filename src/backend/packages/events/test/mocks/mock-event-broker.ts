/**
 * @file mock-event-broker.ts
 * @description Implements a complete in-memory event broker that simulates the publish/subscribe pattern
 * for testing event-driven communication between services. This mock supports topics, subscriptions,
 * and message routing without requiring an actual Kafka instance, making it ideal for integration
 * testing of event-producing and consuming services.
 */

import { EventEmitter } from 'events';
import { BaseEvent, EventMetadata } from '../../src/interfaces/base-event.interface';
import { KafkaEvent, KafkaHeaders } from '../../src/interfaces/kafka-event.interface';
import { IEventHandler } from '../../src/interfaces/event-handler.interface';
import { IEventResponse } from '../../src/interfaces/event-response.interface';

/**
 * Interface for message delivery tracking
 */
export interface DeliveryRecord {
  /** Unique ID for the delivery record */
  id: string;
  /** Topic the message was delivered to */
  topic: string;
  /** Partition the message was delivered to */
  partition: number;
  /** Message key if provided */
  key?: string;
  /** Timestamp when the message was delivered */
  timestamp: string;
  /** Whether delivery was successful */
  successful: boolean;
  /** Error message if delivery failed */
  error?: string;
  /** Consumer group that received the message (if any) */
  consumerGroup?: string;
  /** Number of retry attempts if any */
  retryCount: number;
}

/**
 * Interface for subscription options
 */
export interface SubscriptionOptions {
  /** Consumer group ID for this subscription */
  groupId?: string;
  /** Whether to process messages from the beginning of the topic */
  fromBeginning?: boolean;
  /** Maximum number of messages to process in parallel */
  concurrency?: number;
  /** Whether to auto-commit offsets */
  autoCommit?: boolean;
  /** Specific partitions to subscribe to (if not provided, subscribes to all) */
  partitions?: number[];
  /** Retry configuration */
  retry?: {
    /** Maximum number of retries */
    maxRetries: number;
    /** Initial retry delay in milliseconds */
    initialRetryTime: number;
    /** Factor to multiply delay by for each retry */
    backoffFactor: number;
  };
}

/**
 * Interface for publish options
 */
export interface PublishOptions {
  /** Key for the message (used for partitioning) */
  key?: string;
  /** Headers for the message */
  headers?: KafkaHeaders;
  /** Specific partition to publish to */
  partition?: number;
  /** Whether to wait for acknowledgment */
  requireAcks?: boolean;
  /** Timeout for acknowledgment in milliseconds */
  ackTimeout?: number;
}

/**
 * Interface for a message stored in the broker
 */
interface StoredMessage {
  /** The Kafka event */
  event: KafkaEvent;
  /** Offset within the partition */
  offset: number;
  /** Timestamp when the message was stored */
  timestamp: string;
  /** Message key if provided */
  key?: string;
  /** Message headers if provided */
  headers?: KafkaHeaders;
}

/**
 * Interface for a topic partition
 */
interface Partition {
  /** Messages stored in this partition */
  messages: StoredMessage[];
  /** Next offset to assign */
  nextOffset: number;
}

/**
 * Interface for a topic
 */
interface Topic {
  /** Name of the topic */
  name: string;
  /** Partitions in this topic */
  partitions: Map<number, Partition>;
  /** Number of partitions */
  partitionCount: number;
}

/**
 * Interface for a consumer group
 */
interface ConsumerGroup {
  /** ID of the consumer group */
  id: string;
  /** Map of topic-partition to current offset */
  offsets: Map<string, Map<number, number>>;
  /** Consumers in this group */
  consumers: Set<string>;
}

/**
 * Interface for a subscription
 */
interface Subscription {
  /** ID of the subscription */
  id: string;
  /** Topic subscribed to */
  topic: string;
  /** Handler function */
  handler: (event: KafkaEvent) => Promise<IEventResponse>;
  /** Subscription options */
  options: SubscriptionOptions;
  /** Consumer ID */
  consumerId: string;
  /** Whether the subscription is active */
  active: boolean;
}

/**
 * MockEventBroker simulates a Kafka-like event broker for testing purposes.
 * It provides an in-memory implementation of topics, partitions, consumer groups,
 * and message delivery with support for most Kafka features.
 */
export class MockEventBroker {
  /** Map of topic name to topic */
  private topics: Map<string, Topic> = new Map();
  /** Map of consumer group ID to consumer group */
  private consumerGroups: Map<string, ConsumerGroup> = new Map();
  /** Map of subscription ID to subscription */
  private subscriptions: Map<string, Subscription> = new Map();
  /** Event emitter for internal events */
  private eventEmitter: EventEmitter = new EventEmitter();
  /** Delivery records for tracking message delivery */
  private deliveryRecords: DeliveryRecord[] = [];
  /** Whether the broker is available */
  private available: boolean = true;
  /** Default number of partitions for new topics */
  private defaultPartitionCount: number = 3;
  /** Map of pending retry messages */
  private pendingRetries: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Creates a new MockEventBroker instance
   * @param options Configuration options
   */
  constructor(options?: {
    /** Default number of partitions for new topics */
    defaultPartitionCount?: number;
    /** Initial topics to create */
    initialTopics?: string[];
    /** Whether the broker is initially available */
    initiallyAvailable?: boolean;
  }) {
    this.defaultPartitionCount = options?.defaultPartitionCount ?? 3;
    this.available = options?.initiallyAvailable ?? true;

    // Create initial topics if provided
    if (options?.initialTopics) {
      for (const topic of options.initialTopics) {
        this.createTopic(topic);
      }
    }

    // Set maximum listeners to avoid memory leak warnings
    this.eventEmitter.setMaxListeners(100);
  }

  /**
   * Creates a new topic with the specified number of partitions
   * @param topicName Name of the topic to create
   * @param partitionCount Number of partitions (defaults to defaultPartitionCount)
   * @returns The created topic
   */
  public createTopic(topicName: string, partitionCount?: number): Topic {
    if (this.topics.has(topicName)) {
      return this.topics.get(topicName)!;
    }

    const partitions = new Map<number, Partition>();
    const actualPartitionCount = partitionCount ?? this.defaultPartitionCount;

    // Initialize partitions
    for (let i = 0; i < actualPartitionCount; i++) {
      partitions.set(i, { messages: [], nextOffset: 0 });
    }

    const topic: Topic = {
      name: topicName,
      partitions,
      partitionCount: actualPartitionCount,
    };

    this.topics.set(topicName, topic);
    return topic;
  }

  /**
   * Deletes a topic
   * @param topicName Name of the topic to delete
   * @returns True if the topic was deleted, false if it didn't exist
   */
  public deleteTopic(topicName: string): boolean {
    if (!this.topics.has(topicName)) {
      return false;
    }

    // Remove all subscriptions to this topic
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.topic === topicName) {
        this.subscriptions.delete(id);
      }
    }

    // Remove topic offsets from consumer groups
    for (const group of this.consumerGroups.values()) {
      group.offsets.delete(topicName);
    }

    this.topics.delete(topicName);
    return true;
  }

  /**
   * Gets a list of all topics
   * @returns Array of topic names
   */
  public getTopics(): string[] {
    return Array.from(this.topics.keys());
  }

  /**
   * Gets information about a specific topic
   * @param topicName Name of the topic
   * @returns Topic information or null if the topic doesn't exist
   */
  public getTopicInfo(topicName: string): { name: string; partitionCount: number } | null {
    const topic = this.topics.get(topicName);
    if (!topic) {
      return null;
    }

    return {
      name: topic.name,
      partitionCount: topic.partitionCount,
    };
  }

  /**
   * Creates a consumer group if it doesn't exist
   * @param groupId ID of the consumer group
   * @returns The consumer group
   */
  private ensureConsumerGroup(groupId: string): ConsumerGroup {
    if (!this.consumerGroups.has(groupId)) {
      this.consumerGroups.set(groupId, {
        id: groupId,
        offsets: new Map(),
        consumers: new Set(),
      });
    }

    return this.consumerGroups.get(groupId)!;
  }

  /**
   * Gets the current offset for a topic-partition in a consumer group
   * @param groupId ID of the consumer group
   * @param topicName Name of the topic
   * @param partition Partition number
   * @returns Current offset or 0 if not set
   */
  private getConsumerGroupOffset(groupId: string, topicName: string, partition: number): number {
    const group = this.consumerGroups.get(groupId);
    if (!group) {
      return 0;
    }

    const topicOffsets = group.offsets.get(topicName);
    if (!topicOffsets) {
      return 0;
    }

    return topicOffsets.get(partition) ?? 0;
  }

  /**
   * Sets the current offset for a topic-partition in a consumer group
   * @param groupId ID of the consumer group
   * @param topicName Name of the topic
   * @param partition Partition number
   * @param offset Offset to set
   */
  private setConsumerGroupOffset(groupId: string, topicName: string, partition: number, offset: number): void {
    const group = this.ensureConsumerGroup(groupId);

    if (!group.offsets.has(topicName)) {
      group.offsets.set(topicName, new Map());
    }

    const topicOffsets = group.offsets.get(topicName)!;
    topicOffsets.set(partition, offset);
  }

  /**
   * Determines the partition for a message based on key or round-robin
   * @param topic Topic to publish to
   * @param key Optional key for consistent partitioning
   * @param specificPartition Optional specific partition to use
   * @returns Partition number
   */
  private determinePartition(topic: Topic, key?: string, specificPartition?: number): number {
    // If a specific partition is requested and it's valid, use it
    if (specificPartition !== undefined && specificPartition >= 0 && specificPartition < topic.partitionCount) {
      return specificPartition;
    }

    // If a key is provided, use consistent hashing
    if (key) {
      // Simple hash function for the key
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash) + key.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash) % topic.partitionCount;
    }

    // Otherwise, use round-robin (random for simplicity)
    return Math.floor(Math.random() * topic.partitionCount);
  }

  /**
   * Publishes an event to a topic
   * @param topicName Name of the topic to publish to
   * @param event Event to publish
   * @param options Publish options
   * @returns Promise resolving to delivery record
   */
  public async publish<T = any>(
    topicName: string,
    event: BaseEvent<T>,
    options?: PublishOptions
  ): Promise<DeliveryRecord> {
    // Check if broker is available
    if (!this.available) {
      const deliveryRecord: DeliveryRecord = {
        id: crypto.randomUUID(),
        topic: topicName,
        partition: -1,
        key: options?.key,
        timestamp: new Date().toISOString(),
        successful: false,
        error: 'Broker is unavailable',
        retryCount: 0,
      };
      this.deliveryRecords.push(deliveryRecord);
      return deliveryRecord;
    }

    // Create topic if it doesn't exist
    let topic = this.topics.get(topicName);
    if (!topic) {
      topic = this.createTopic(topicName);
    }

    // Determine partition
    const partition = this.determinePartition(topic, options?.key, options?.partition);
    const partitionData = topic.partitions.get(partition)!;

    // Create Kafka event
    const kafkaEvent: KafkaEvent<T> = {
      ...event,
      topic: topicName,
      partition,
      offset: partitionData.nextOffset.toString(),
      key: options?.key,
      headers: options?.headers,
    };

    // Store message in partition
    const storedMessage: StoredMessage = {
      event: kafkaEvent,
      offset: partitionData.nextOffset,
      timestamp: new Date().toISOString(),
      key: options?.key,
      headers: options?.headers,
    };

    partitionData.messages.push(storedMessage);
    partitionData.nextOffset++;

    // Create delivery record
    const deliveryRecord: DeliveryRecord = {
      id: crypto.randomUUID(),
      topic: topicName,
      partition,
      key: options?.key,
      timestamp: storedMessage.timestamp,
      successful: true,
      retryCount: 0,
    };
    this.deliveryRecords.push(deliveryRecord);

    // Notify subscribers
    this.notifySubscribers(topicName, partition, kafkaEvent);

    return deliveryRecord;
  }

  /**
   * Notifies subscribers of a new message
   * @param topicName Name of the topic
   * @param partition Partition number
   * @param event Kafka event
   */
  private notifySubscribers(topicName: string, partition: number, event: KafkaEvent): void {
    // Find all active subscriptions for this topic
    const topicSubscriptions = Array.from(this.subscriptions.values()).filter(
      (sub) => sub.topic === topicName && sub.active
    );

    // Group subscriptions by consumer group
    const subscriptionsByGroup = new Map<string, Subscription[]>();
    for (const subscription of topicSubscriptions) {
      const groupId = subscription.options.groupId || 'default';
      if (!subscriptionsByGroup.has(groupId)) {
        subscriptionsByGroup.set(groupId, []);
      }
      subscriptionsByGroup.get(groupId)!.push(subscription);
    }

    // For each consumer group, select one subscription to receive the message
    for (const [groupId, groupSubscriptions] of subscriptionsByGroup.entries()) {
      // Check if this subscription should receive this partition
      const eligibleSubscriptions = groupSubscriptions.filter((sub) => {
        // If partitions are specified, check if this partition is included
        if (sub.options.partitions && !sub.options.partitions.includes(partition)) {
          return false;
        }
        return true;
      });

      if (eligibleSubscriptions.length === 0) {
        continue;
      }

      // Get current offset for this consumer group
      const currentOffset = this.getConsumerGroupOffset(groupId, topicName, partition);
      const eventOffset = parseInt(event.offset || '0', 10);

      // Skip if this message has already been processed by this consumer group
      // unless fromBeginning is true
      const fromBeginning = eligibleSubscriptions[0].options.fromBeginning;
      if (!fromBeginning && eventOffset < currentOffset) {
        continue;
      }

      // Select one subscription from the group (round-robin for simplicity)
      const selectedIndex = Math.floor(Math.random() * eligibleSubscriptions.length);
      const selectedSubscription = eligibleSubscriptions[selectedIndex];

      // Process the message
      this.processMessage(selectedSubscription, event, groupId);
    }

    // Also notify subscriptions without a consumer group
    const individualSubscriptions = topicSubscriptions.filter((sub) => !sub.options.groupId);
    for (const subscription of individualSubscriptions) {
      // Check if this subscription should receive this partition
      if (
        subscription.options.partitions &&
        !subscription.options.partitions.includes(partition)
      ) {
        continue;
      }

      // Process the message
      this.processMessage(subscription, event);
    }
  }

  /**
   * Processes a message for a subscription
   * @param subscription Subscription to process for
   * @param event Kafka event
   * @param groupId Optional consumer group ID
   */
  private async processMessage(
    subscription: Subscription,
    event: KafkaEvent,
    groupId?: string
  ): Promise<void> {
    try {
      // Call the handler
      const response = await subscription.handler(event);

      // Update consumer group offset if auto-commit is enabled
      if (groupId && subscription.options.autoCommit !== false) {
        const offset = parseInt(event.offset || '0', 10) + 1;
        this.setConsumerGroupOffset(groupId, event.topic, event.partition || 0, offset);
      }

      // Update delivery record
      const deliveryRecord: DeliveryRecord = {
        id: crypto.randomUUID(),
        topic: event.topic,
        partition: event.partition || 0,
        key: event.key,
        timestamp: new Date().toISOString(),
        successful: response.success,
        error: response.success ? undefined : response.error?.message,
        consumerGroup: groupId,
        retryCount: 0,
      };
      this.deliveryRecords.push(deliveryRecord);

      // If processing failed and retry is configured, schedule a retry
      if (!response.success && subscription.options.retry && subscription.options.retry.maxRetries > 0) {
        this.scheduleRetry(subscription, event, groupId, 1);
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update delivery record
      const deliveryRecord: DeliveryRecord = {
        id: crypto.randomUUID(),
        topic: event.topic,
        partition: event.partition || 0,
        key: event.key,
        timestamp: new Date().toISOString(),
        successful: false,
        error: errorMessage,
        consumerGroup: groupId,
        retryCount: 0,
      };
      this.deliveryRecords.push(deliveryRecord);

      // If retry is configured, schedule a retry
      if (subscription.options.retry && subscription.options.retry.maxRetries > 0) {
        this.scheduleRetry(subscription, event, groupId, 1);
      }
    }
  }

  /**
   * Schedules a retry for a failed message
   * @param subscription Subscription that failed
   * @param event Kafka event
   * @param groupId Optional consumer group ID
   * @param retryCount Current retry count
   */
  private scheduleRetry(
    subscription: Subscription,
    event: KafkaEvent,
    groupId?: string,
    retryCount: number = 1
  ): void {
    if (!subscription.options.retry || retryCount > subscription.options.retry.maxRetries) {
      return;
    }

    // Calculate delay with exponential backoff
    const { initialRetryTime, backoffFactor } = subscription.options.retry;
    const delay = initialRetryTime * Math.pow(backoffFactor, retryCount - 1);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.2 * delay;
    const finalDelay = delay + jitter;

    // Create a unique ID for this retry
    const retryId = `${subscription.id}-${event.eventId}-${retryCount}`;

    // Schedule retry
    const timeout = setTimeout(() => {
      // Remove from pending retries
      this.pendingRetries.delete(retryId);

      // Only retry if subscription is still active
      if (subscription.active) {
        // Update event metadata for retry
        const retryEvent: KafkaEvent = {
          ...event,
          metadata: {
            ...event.metadata,
            isRetry: true,
            retryCount,
            originalTimestamp: event.metadata?.originalTimestamp || event.timestamp,
          },
        };

        // Process the retry
        this.processMessage(subscription, retryEvent, groupId);
      }
    }, finalDelay);

    // Store timeout for cleanup
    this.pendingRetries.set(retryId, timeout);
  }

  /**
   * Subscribes to a topic
   * @param topicName Name of the topic to subscribe to
   * @param handler Handler function for messages
   * @param options Subscription options
   * @returns Subscription ID
   */
  public subscribe(
    topicName: string,
    handler: (event: KafkaEvent) => Promise<IEventResponse>,
    options: SubscriptionOptions = {}
  ): string {
    // Create topic if it doesn't exist
    if (!this.topics.has(topicName)) {
      this.createTopic(topicName);
    }

    // Create consumer group if specified
    if (options.groupId) {
      this.ensureConsumerGroup(options.groupId);
    }

    // Create subscription
    const subscriptionId = crypto.randomUUID();
    const consumerId = crypto.randomUUID();

    const subscription: Subscription = {
      id: subscriptionId,
      topic: topicName,
      handler,
      options,
      consumerId,
      active: true,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Add consumer to group if applicable
    if (options.groupId) {
      const group = this.consumerGroups.get(options.groupId)!;
      group.consumers.add(consumerId);
    }

    // If fromBeginning is true, process all existing messages
    if (options.fromBeginning) {
      this.processExistingMessages(subscription, options.groupId);
    }

    return subscriptionId;
  }

  /**
   * Processes existing messages for a new subscription with fromBeginning=true
   * @param subscription Subscription to process for
   * @param groupId Optional consumer group ID
   */
  private processExistingMessages(subscription: Subscription, groupId?: string): void {
    const topic = this.topics.get(subscription.topic);
    if (!topic) {
      return;
    }

    // Determine which partitions to process
    const partitions = subscription.options.partitions || Array.from(topic.partitions.keys());

    // Process messages from each partition
    for (const partition of partitions) {
      const partitionData = topic.partitions.get(partition);
      if (!partitionData) {
        continue;
      }

      // Get starting offset for this consumer group
      let startOffset = 0;
      if (groupId) {
        startOffset = this.getConsumerGroupOffset(groupId, subscription.topic, partition);
      }

      // Process all messages from the starting offset
      for (let i = startOffset; i < partitionData.messages.length; i++) {
        const message = partitionData.messages[i];
        this.processMessage(subscription, message.event, groupId);
      }
    }
  }

  /**
   * Unsubscribes from a topic
   * @param subscriptionId ID of the subscription to unsubscribe
   * @returns True if the subscription was found and removed, false otherwise
   */
  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    // Remove consumer from group if applicable
    if (subscription.options.groupId) {
      const group = this.consumerGroups.get(subscription.options.groupId);
      if (group) {
        group.consumers.delete(subscription.consumerId);
      }
    }

    // Mark subscription as inactive
    subscription.active = false;

    // Remove subscription
    this.subscriptions.delete(subscriptionId);

    // Cancel any pending retries for this subscription
    for (const [retryId, timeout] of this.pendingRetries.entries()) {
      if (retryId.startsWith(`${subscriptionId}-`)) {
        clearTimeout(timeout);
        this.pendingRetries.delete(retryId);
      }
    }

    return true;
  }

  /**
   * Gets all delivery records
   * @returns Array of delivery records
   */
  public getDeliveryRecords(): DeliveryRecord[] {
    return [...this.deliveryRecords];
  }

  /**
   * Gets delivery records for a specific topic
   * @param topicName Name of the topic
   * @returns Array of delivery records for the topic
   */
  public getDeliveryRecordsForTopic(topicName: string): DeliveryRecord[] {
    return this.deliveryRecords.filter((record) => record.topic === topicName);
  }

  /**
   * Gets delivery records for a specific consumer group
   * @param groupId ID of the consumer group
   * @returns Array of delivery records for the consumer group
   */
  public getDeliveryRecordsForConsumerGroup(groupId: string): DeliveryRecord[] {
    return this.deliveryRecords.filter((record) => record.consumerGroup === groupId);
  }

  /**
   * Gets successful delivery records
   * @returns Array of successful delivery records
   */
  public getSuccessfulDeliveryRecords(): DeliveryRecord[] {
    return this.deliveryRecords.filter((record) => record.successful);
  }

  /**
   * Gets failed delivery records
   * @returns Array of failed delivery records
   */
  public getFailedDeliveryRecords(): DeliveryRecord[] {
    return this.deliveryRecords.filter((record) => !record.successful);
  }

  /**
   * Clears all delivery records
   */
  public clearDeliveryRecords(): void {
    this.deliveryRecords = [];
  }

  /**
   * Simulates broker downtime
   */
  public simulateDowntime(): void {
    this.available = false;
  }

  /**
   * Simulates broker recovery
   */
  public simulateRecovery(): void {
    this.available = true;
  }

  /**
   * Gets the broker availability status
   * @returns True if the broker is available, false otherwise
   */
  public isAvailable(): boolean {
    return this.available;
  }

  /**
   * Gets all messages for a topic
   * @param topicName Name of the topic
   * @returns Array of messages for the topic
   */
  public getMessages(topicName: string): KafkaEvent[] {
    const topic = this.topics.get(topicName);
    if (!topic) {
      return [];
    }

    const messages: KafkaEvent[] = [];
    for (const partition of topic.partitions.values()) {
      for (const message of partition.messages) {
        messages.push(message.event);
      }
    }

    return messages;
  }

  /**
   * Gets messages for a specific partition of a topic
   * @param topicName Name of the topic
   * @param partition Partition number
   * @returns Array of messages for the partition
   */
  public getMessagesForPartition(topicName: string, partition: number): KafkaEvent[] {
    const topic = this.topics.get(topicName);
    if (!topic) {
      return [];
    }

    const partitionData = topic.partitions.get(partition);
    if (!partitionData) {
      return [];
    }

    return partitionData.messages.map((message) => message.event);
  }

  /**
   * Gets the current offset for a consumer group on a topic-partition
   * @param groupId ID of the consumer group
   * @param topicName Name of the topic
   * @param partition Partition number
   * @returns Current offset
   */
  public getOffset(groupId: string, topicName: string, partition: number): number {
    return this.getConsumerGroupOffset(groupId, topicName, partition);
  }

  /**
   * Manually commits an offset for a consumer group on a topic-partition
   * @param groupId ID of the consumer group
   * @param topicName Name of the topic
   * @param partition Partition number
   * @param offset Offset to commit
   */
  public commitOffset(groupId: string, topicName: string, partition: number, offset: number): void {
    this.setConsumerGroupOffset(groupId, topicName, partition, offset);
  }

  /**
   * Gets all consumer groups
   * @returns Array of consumer group IDs
   */
  public getConsumerGroups(): string[] {
    return Array.from(this.consumerGroups.keys());
  }

  /**
   * Gets information about a specific consumer group
   * @param groupId ID of the consumer group
   * @returns Consumer group information or null if the group doesn't exist
   */
  public getConsumerGroupInfo(groupId: string): {
    id: string;
    consumerCount: number;
    topics: string[];
  } | null {
    const group = this.consumerGroups.get(groupId);
    if (!group) {
      return null;
    }

    return {
      id: group.id,
      consumerCount: group.consumers.size,
      topics: Array.from(group.offsets.keys()),
    };
  }

  /**
   * Gets all subscriptions
   * @returns Array of subscription IDs
   */
  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Gets information about a specific subscription
   * @param subscriptionId ID of the subscription
   * @returns Subscription information or null if the subscription doesn't exist
   */
  public getSubscriptionInfo(subscriptionId: string): {
    id: string;
    topic: string;
    active: boolean;
    groupId?: string;
  } | null {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      topic: subscription.topic,
      active: subscription.active,
      groupId: subscription.options.groupId,
    };
  }

  /**
   * Resets the broker to its initial state
   */
  public reset(): void {
    // Clear all topics
    this.topics.clear();

    // Clear all consumer groups
    this.consumerGroups.clear();

    // Clear all subscriptions
    this.subscriptions.clear();

    // Clear all delivery records
    this.deliveryRecords = [];

    // Cancel all pending retries
    for (const [retryId, timeout] of this.pendingRetries.entries()) {
      clearTimeout(timeout);
    }
    this.pendingRetries.clear();

    // Reset availability
    this.available = true;
  }

  /**
   * Cleans up resources when the broker is no longer needed
   */
  public cleanup(): void {
    // Cancel all pending retries
    for (const [retryId, timeout] of this.pendingRetries.entries()) {
      clearTimeout(timeout);
    }
    this.pendingRetries.clear();

    // Remove all listeners
    this.eventEmitter.removeAllListeners();
  }
}

/**
 * Creates a mock event handler for testing
 * @param eventType Type of event to handle
 * @param handler Custom handler function
 * @returns Mock event handler
 */
export function createMockEventHandler<T = any, R = any>(
  eventType: string,
  handler?: (event: T) => Promise<IEventResponse<R>>
): IEventHandler<T, R> {
  return {
    handle: async (event: T) => {
      if (handler) {
        return handler(event);
      }
      return {
        success: true,
        eventId: (event as any).eventId || 'unknown',
        eventType,
        data: undefined,
        metadata: {
          processingTimeMs: 0,
          completedAt: new Date().toISOString(),
        },
      };
    },
    canHandle: async (event: any) => {
      return {
        isValid: event && (event.type === eventType || event.eventType === eventType),
        errors: [],
      };
    },
    getEventType: () => eventType,
  };
}
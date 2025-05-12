/**
 * @file mock-event-broker.ts
 * @description Implements a complete in-memory event broker that simulates the publish/subscribe pattern
 * for testing event-driven communication between services. This mock supports topics, subscriptions,
 * and message routing without requiring an actual Kafka instance, making it ideal for integration
 * testing of event-producing and consuming services.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { IBaseEvent, EventMetadata } from '../../src/interfaces/base-event.interface';
import { KafkaEvent, KafkaHeaders } from '../../src/interfaces/kafka-event.interface';
import { IEventHandler, EventHandlerContext } from '../../src/interfaces/event-handler.interface';
import { 
  IEventResponse, 
  EventResponseStatus, 
  createSuccessResponse,
  createFailureResponse,
  createRetryResponse
} from '../../src/interfaces/event-response.interface';

/**
 * Interface for a subscriber to the mock event broker
 */
export interface IMockEventSubscriber<T = any> {
  /**
   * Unique identifier for this subscriber
   */
  id: string;

  /**
   * The topic this subscriber is listening to
   */
  topic: string;

  /**
   * The consumer group this subscriber belongs to (if any)
   */
  groupId?: string;

  /**
   * The partition this subscriber is assigned to (if any)
   */
  partition?: number;

  /**
   * Callback function to handle received events
   */
  handler: (event: KafkaEvent<T>) => Promise<IEventResponse>;

  /**
   * Context information for this subscriber
   */
  context?: EventHandlerContext;

  /**
   * Whether this subscriber is currently active
   */
  active: boolean;
}

/**
 * Options for subscribing to the mock event broker
 */
export interface MockSubscriptionOptions {
  /**
   * The topic to subscribe to
   */
  topic: string;

  /**
   * Optional consumer group ID
   * Subscribers with the same group ID will share the message load
   */
  groupId?: string;

  /**
   * Optional specific partition to subscribe to
   */
  partition?: number;

  /**
   * Whether to receive messages from the beginning of the topic
   * If false, will only receive messages published after subscription
   */
  fromBeginning?: boolean;

  /**
   * Context information for the subscriber
   */
  context?: EventHandlerContext;

  /**
   * Maximum number of retry attempts for failed messages
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for retry backoff
   */
  retryBaseDelayMs?: number;
}

/**
 * Options for publishing events to the mock broker
 */
export interface MockPublishOptions {
  /**
   * The topic to publish to
   */
  topic: string;

  /**
   * Optional specific partition to publish to
   */
  partition?: number;

  /**
   * Optional key for partitioning
   * Events with the same key will go to the same partition
   */
  key?: string;

  /**
   * Optional headers for the event
   */
  headers?: KafkaHeaders;

  /**
   * Whether to track delivery of this event
   */
  trackDelivery?: boolean;
}

/**
 * Represents a message stored in a topic partition
 */
interface TopicMessage<T = any> {
  /**
   * The offset of this message in the partition
   */
  offset: number;

  /**
   * The key of this message (if any)
   */
  key?: string;

  /**
   * The headers of this message (if any)
   */
  headers?: KafkaHeaders;

  /**
   * The event payload
   */
  event: KafkaEvent<T>;

  /**
   * Timestamp when the message was published
   */
  publishedAt: number;

  /**
   * List of consumer groups that have processed this message
   */
  consumedBy: Set<string>;
}

/**
 * Represents a topic partition
 */
interface TopicPartition {
  /**
   * The topic this partition belongs to
   */
  topic: string;

  /**
   * The partition number
   */
  partition: number;

  /**
   * Messages in this partition
   */
  messages: TopicMessage[];

  /**
   * Current offset for this partition
   */
  currentOffset: number;
}

/**
 * Represents the delivery status of an event
 */
export interface EventDeliveryStatus {
  /**
   * The event ID
   */
  eventId: string;

  /**
   * The topic the event was published to
   */
  topic: string;

  /**
   * The partition the event was published to
   */
  partition: number;

  /**
   * The offset of the event in the partition
   */
  offset: number;

  /**
   * Whether the event was delivered to at least one subscriber
   */
  delivered: boolean;

  /**
   * List of subscriber IDs that received the event
   */
  deliveredTo: string[];

  /**
   * List of subscriber IDs that successfully processed the event
   */
  processedBy: string[];

  /**
   * List of subscriber IDs that failed to process the event
   */
  failedBy: string[];

  /**
   * List of errors encountered during processing
   */
  errors: Array<{ subscriberId: string; error: Error }>;

  /**
   * Timestamp when the event was published
   */
  publishedAt: number;

  /**
   * Timestamp when the event was first delivered
   */
  firstDeliveredAt?: number;

  /**
   * Timestamp when the event was last delivered
   */
  lastDeliveredAt?: number;
}

/**
 * Retry strategy for failed event processing
 */
export interface RetryStrategy {
  /**
   * Calculate the delay before the next retry attempt
   * @param attempt - The current retry attempt (1-based)
   * @param error - The error that caused the failure
   * @returns The delay in milliseconds before the next retry
   */
  calculateDelay(attempt: number, error: Error): number;

  /**
   * Determine if an error is retryable
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(error: Error): boolean;

  /**
   * Get the maximum number of retry attempts
   * @returns The maximum number of retry attempts
   */
  getMaxRetries(): number;
}

/**
 * Default exponential backoff retry strategy
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
  /**
   * @param maxRetries - Maximum number of retry attempts
   * @param baseDelayMs - Base delay in milliseconds
   * @param maxDelayMs - Maximum delay in milliseconds
   * @param jitter - Whether to add jitter to the delay
   */
  constructor(
    private readonly maxRetries: number = 3,
    private readonly baseDelayMs: number = 100,
    private readonly maxDelayMs: number = 10000,
    private readonly jitter: boolean = true
  ) {}

  /**
   * Calculate the delay before the next retry attempt using exponential backoff
   * @param attempt - The current retry attempt (1-based)
   * @returns The delay in milliseconds before the next retry
   */
  calculateDelay(attempt: number): number {
    // Calculate exponential backoff: baseDelay * 2^attempt
    let delay = this.baseDelayMs * Math.pow(2, attempt - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, this.maxDelayMs);
    
    // Add jitter if enabled (±20%)
    if (this.jitter) {
      const jitterFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
      delay = Math.floor(delay * jitterFactor);
    }
    
    return delay;
  }

  /**
   * Determine if an error is retryable
   * By default, all errors are considered retryable except those explicitly marked as not
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(error: Error): boolean {
    // @ts-ignore - Check for retryable property
    if (error.retryable === false) {
      return false;
    }
    
    // Check for specific error types that should not be retried
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return false;
    }
    
    return true;
  }

  /**
   * Get the maximum number of retry attempts
   * @returns The maximum number of retry attempts
   */
  getMaxRetries(): number {
    return this.maxRetries;
  }
}

/**
 * Mock event broker that simulates Kafka-like publish/subscribe functionality
 * for testing event-driven communication between services.
 */
export class MockEventBroker {
  /**
   * Map of topic partitions
   * Key: topic:partition
   * Value: TopicPartition object
   */
  private topicPartitions: Map<string, TopicPartition> = new Map();

  /**
   * Map of subscribers
   * Key: subscriber ID
   * Value: Subscriber object
   */
  private subscribers: Map<string, IMockEventSubscriber> = new Map();

  /**
   * Map of consumer group offsets
   * Key: topic:partition:groupId
   * Value: current offset for this group
   */
  private consumerGroupOffsets: Map<string, number> = new Map();

  /**
   * Map of event delivery statuses
   * Key: event ID
   * Value: EventDeliveryStatus object
   */
  private deliveryStatus: Map<string, EventDeliveryStatus> = new Map();

  /**
   * Event emitter for broker events
   */
  private eventEmitter: EventEmitter = new EventEmitter();

  /**
   * Default retry strategy
   */
  private retryStrategy: RetryStrategy = new ExponentialBackoffStrategy();

  /**
   * Whether the broker is currently active
   */
  private active: boolean = true;

  /**
   * Map of pending retries
   * Key: event ID + subscriber ID
   * Value: timeout ID
   */
  private pendingRetries: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Creates a new MockEventBroker
   * @param options - Configuration options
   */
  constructor(options?: {
    retryStrategy?: RetryStrategy;
    defaultPartitions?: number;
  }) {
    if (options?.retryStrategy) {
      this.retryStrategy = options.retryStrategy;
    }

    // Set up event listeners
    this.eventEmitter.setMaxListeners(100); // Increase max listeners to avoid warnings
  }

  /**
   * Publishes an event to the specified topic
   * @param event - The event to publish
   * @param options - Publishing options
   * @returns The Kafka event that was published
   */
  async publish<T = any>(event: IBaseEvent<T>, options: MockPublishOptions): Promise<KafkaEvent<T>> {
    if (!this.active) {
      throw new Error('Broker is not active');
    }

    // Ensure the topic exists
    const partition = options.partition ?? this.getPartitionForKey(options.topic, options.key);
    const topicPartitionKey = `${options.topic}:${partition}`;
    
    if (!this.topicPartitions.has(topicPartitionKey)) {
      this.createTopicPartition(options.topic, partition);
    }

    const topicPartition = this.topicPartitions.get(topicPartitionKey)!;
    
    // Create Kafka event
    const kafkaEvent: KafkaEvent<T> = {
      ...event,
      topic: options.topic,
      partition,
      offset: topicPartition.currentOffset,
      key: options.key,
      headers: options.headers || {},
    };

    // Create topic message
    const message: TopicMessage<T> = {
      offset: topicPartition.currentOffset,
      key: options.key,
      headers: options.headers,
      event: kafkaEvent,
      publishedAt: Date.now(),
      consumedBy: new Set(),
    };

    // Add message to topic partition
    topicPartition.messages.push(message);
    topicPartition.currentOffset++;

    // Track delivery if requested
    if (options.trackDelivery) {
      this.trackEventDelivery(kafkaEvent, message.publishedAt);
    }

    // Notify subscribers
    this.notifySubscribers(kafkaEvent, message);

    return kafkaEvent;
  }

  /**
   * Subscribes to a topic
   * @param handler - The event handler function
   * @param options - Subscription options
   * @returns The subscriber ID
   */
  subscribe<T = any>(
    handler: (event: KafkaEvent<T>) => Promise<IEventResponse>,
    options: MockSubscriptionOptions
  ): string {
    if (!this.active) {
      throw new Error('Broker is not active');
    }

    const subscriberId = uuidv4();
    const partition = options.partition ?? 0;

    // Create subscriber
    const subscriber: IMockEventSubscriber<T> = {
      id: subscriberId,
      topic: options.topic,
      groupId: options.groupId,
      partition: options.partition,
      handler,
      context: options.context || {},
      active: true,
    };

    // Add subscriber
    this.subscribers.set(subscriberId, subscriber);

    // Ensure the topic partition exists
    const topicPartitionKey = `${options.topic}:${partition}`;
    if (!this.topicPartitions.has(topicPartitionKey)) {
      this.createTopicPartition(options.topic, partition);
    }

    // Set up consumer group offset if needed
    if (options.groupId && options.fromBeginning) {
      const groupOffsetKey = `${options.topic}:${partition}:${options.groupId}`;
      if (!this.consumerGroupOffsets.has(groupOffsetKey)) {
        this.consumerGroupOffsets.set(groupOffsetKey, 0);
      }
    } else if (options.groupId) {
      const topicPartition = this.topicPartitions.get(topicPartitionKey)!;
      const groupOffsetKey = `${options.topic}:${partition}:${options.groupId}`;
      this.consumerGroupOffsets.set(groupOffsetKey, topicPartition.currentOffset);
    }

    // If fromBeginning is true, deliver all existing messages
    if (options.fromBeginning) {
      this.deliverExistingMessages(subscriber);
    }

    return subscriberId;
  }

  /**
   * Unsubscribes a subscriber
   * @param subscriberId - The ID of the subscriber to unsubscribe
   * @returns True if the subscriber was found and unsubscribed, false otherwise
   */
  unsubscribe(subscriberId: string): boolean {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) {
      return false;
    }

    // Cancel any pending retries for this subscriber
    for (const [key, timeout] of this.pendingRetries.entries()) {
      if (key.endsWith(`:${subscriberId}`)) {
        clearTimeout(timeout);
        this.pendingRetries.delete(key);
      }
    }

    // Remove subscriber
    this.subscribers.delete(subscriberId);
    return true;
  }

  /**
   * Pauses a subscriber
   * @param subscriberId - The ID of the subscriber to pause
   * @returns True if the subscriber was found and paused, false otherwise
   */
  pauseSubscriber(subscriberId: string): boolean {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) {
      return false;
    }

    subscriber.active = false;
    return true;
  }

  /**
   * Resumes a paused subscriber
   * @param subscriberId - The ID of the subscriber to resume
   * @returns True if the subscriber was found and resumed, false otherwise
   */
  resumeSubscriber(subscriberId: string): boolean {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) {
      return false;
    }

    subscriber.active = true;
    return true;
  }

  /**
   * Simulates a broker failure
   */
  simulateFailure(): void {
    this.active = false;
    this.eventEmitter.emit('broker.down');
  }

  /**
   * Simulates a broker recovery
   */
  simulateRecovery(): void {
    this.active = true;
    this.eventEmitter.emit('broker.up');
  }

  /**
   * Gets the delivery status for an event
   * @param eventId - The ID of the event
   * @returns The delivery status, or undefined if not found
   */
  getDeliveryStatus(eventId: string): EventDeliveryStatus | undefined {
    return this.deliveryStatus.get(eventId);
  }

  /**
   * Gets all delivery statuses
   * @returns Map of event IDs to delivery statuses
   */
  getAllDeliveryStatuses(): Map<string, EventDeliveryStatus> {
    return new Map(this.deliveryStatus);
  }

  /**
   * Gets all subscribers
   * @returns Map of subscriber IDs to subscribers
   */
  getSubscribers(): Map<string, IMockEventSubscriber> {
    return new Map(this.subscribers);
  }

  /**
   * Gets all topic partitions
   * @returns Map of topic partition keys to topic partitions
   */
  getTopicPartitions(): Map<string, TopicPartition> {
    return new Map(this.topicPartitions);
  }

  /**
   * Gets all messages for a topic partition
   * @param topic - The topic
   * @param partition - The partition
   * @returns Array of messages, or undefined if the topic partition doesn't exist
   */
  getMessages(topic: string, partition: number = 0): TopicMessage[] | undefined {
    const topicPartitionKey = `${topic}:${partition}`;
    const topicPartition = this.topicPartitions.get(topicPartitionKey);
    if (!topicPartition) {
      return undefined;
    }

    return [...topicPartition.messages];
  }

  /**
   * Clears all data from the broker
   */
  clear(): void {
    // Cancel all pending retries
    for (const timeout of this.pendingRetries.values()) {
      clearTimeout(timeout);
    }

    this.topicPartitions.clear();
    this.subscribers.clear();
    this.consumerGroupOffsets.clear();
    this.deliveryStatus.clear();
    this.pendingRetries.clear();
    this.active = true;
  }

  /**
   * Creates a topic partition
   * @param topic - The topic
   * @param partition - The partition
   */
  private createTopicPartition(topic: string, partition: number): void {
    const topicPartitionKey = `${topic}:${partition}`;
    this.topicPartitions.set(topicPartitionKey, {
      topic,
      partition,
      messages: [],
      currentOffset: 0,
    });
  }

  /**
   * Gets the partition for a key
   * @param topic - The topic
   * @param key - The key
   * @returns The partition number
   */
  private getPartitionForKey(topic: string, key?: string): number {
    if (!key) {
      return 0; // Default partition
    }

    // Simple hash function for the key
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    // Get the number of partitions for this topic (at least 1)
    const partitionCount = Math.max(
      1,
      [...this.topicPartitions.keys()]
        .filter(k => k.startsWith(`${topic}:`))
        .length
    );

    // Ensure positive hash value and modulo by partition count
    return Math.abs(hash) % partitionCount;
  }

  /**
   * Tracks the delivery status of an event
   * @param event - The Kafka event
   * @param publishedAt - Timestamp when the event was published
   */
  private trackEventDelivery<T>(event: KafkaEvent<T>, publishedAt: number): void {
    this.deliveryStatus.set(event.eventId, {
      eventId: event.eventId,
      topic: event.topic,
      partition: event.partition,
      offset: event.offset,
      delivered: false,
      deliveredTo: [],
      processedBy: [],
      failedBy: [],
      errors: [],
      publishedAt,
    });
  }

  /**
   * Updates the delivery status of an event
   * @param eventId - The event ID
   * @param subscriberId - The subscriber ID
   * @param status - The delivery status
   * @param error - Optional error if delivery failed
   */
  private updateDeliveryStatus(
    eventId: string,
    subscriberId: string,
    status: 'delivered' | 'processed' | 'failed',
    error?: Error
  ): void {
    const deliveryStatus = this.deliveryStatus.get(eventId);
    if (!deliveryStatus) {
      return;
    }

    const now = Date.now();

    if (status === 'delivered') {
      deliveryStatus.delivered = true;
      deliveryStatus.deliveredTo.push(subscriberId);
      if (!deliveryStatus.firstDeliveredAt) {
        deliveryStatus.firstDeliveredAt = now;
      }
      deliveryStatus.lastDeliveredAt = now;
    } else if (status === 'processed') {
      if (!deliveryStatus.processedBy.includes(subscriberId)) {
        deliveryStatus.processedBy.push(subscriberId);
      }
    } else if (status === 'failed') {
      if (!deliveryStatus.failedBy.includes(subscriberId)) {
        deliveryStatus.failedBy.push(subscriberId);
      }
      if (error) {
        deliveryStatus.errors.push({ subscriberId, error });
      }
    }
  }

  /**
   * Notifies subscribers of a new event
   * @param event - The Kafka event
   * @param message - The topic message
   */
  private notifySubscribers<T>(event: KafkaEvent<T>, message: TopicMessage<T>): void {
    for (const subscriber of this.subscribers.values()) {
      // Skip if subscriber is not active
      if (!subscriber.active) {
        continue;
      }

      // Skip if subscriber is not for this topic
      if (subscriber.topic !== event.topic) {
        continue;
      }

      // Skip if subscriber is for a specific partition and it doesn't match
      if (subscriber.partition !== undefined && subscriber.partition !== event.partition) {
        continue;
      }

      // Skip if this message has already been consumed by this consumer group
      if (subscriber.groupId && message.consumedBy.has(subscriber.groupId)) {
        continue;
      }

      // Skip if this message is before the consumer group's current offset
      if (subscriber.groupId) {
        const groupOffsetKey = `${event.topic}:${event.partition}:${subscriber.groupId}`;
        const groupOffset = this.consumerGroupOffsets.get(groupOffsetKey) || 0;
        if (event.offset < groupOffset) {
          continue;
        }
      }

      // Deliver the event to the subscriber
      this.deliverEventToSubscriber(subscriber, event, message);

      // Mark as consumed by this consumer group
      if (subscriber.groupId) {
        message.consumedBy.add(subscriber.groupId);
      }
    }
  }

  /**
   * Delivers an event to a subscriber
   * @param subscriber - The subscriber
   * @param event - The Kafka event
   * @param message - The topic message
   */
  private async deliverEventToSubscriber<T>(
    subscriber: IMockEventSubscriber,
    event: KafkaEvent<T>,
    message: TopicMessage<T>
  ): Promise<void> {
    // Update delivery status
    this.updateDeliveryStatus(event.eventId, subscriber.id, 'delivered');

    try {
      // Call the handler
      const response = await subscriber.handler(event);

      // Update consumer group offset if successful
      if (subscriber.groupId) {
        const groupOffsetKey = `${event.topic}:${event.partition}:${subscriber.groupId}`;
        const currentOffset = this.consumerGroupOffsets.get(groupOffsetKey) || 0;
        if (event.offset >= currentOffset) {
          this.consumerGroupOffsets.set(groupOffsetKey, event.offset + 1);
        }
      }

      // Update delivery status based on response
      if (response.success) {
        this.updateDeliveryStatus(event.eventId, subscriber.id, 'processed');
      } else if (response.status === EventResponseStatus.RETRY) {
        // Handle retry if applicable
        this.handleRetry(subscriber, event, message, new Error(response.error?.message || 'Unknown error'));
      } else {
        this.updateDeliveryStatus(
          event.eventId,
          subscriber.id,
          'failed',
          new Error(response.error?.message || 'Unknown error')
        );
      }
    } catch (error) {
      // Handle error
      this.handleRetry(subscriber, event, message, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Handles retry for a failed event
   * @param subscriber - The subscriber
   * @param event - The Kafka event
   * @param message - The topic message
   * @param error - The error that caused the failure
   */
  private handleRetry<T>(
    subscriber: IMockEventSubscriber,
    event: KafkaEvent<T>,
    message: TopicMessage<T>,
    error: Error
  ): void {
    // Get retry count from context
    const retryCount = (subscriber.context?.retryCount || 0) + 1;
    const maxRetries = subscriber.context?.maxRetries || this.retryStrategy.getMaxRetries();

    // Check if we should retry
    if (retryCount <= maxRetries && this.retryStrategy.isRetryable(error)) {
      // Calculate retry delay
      const delay = this.retryStrategy.calculateDelay(retryCount, error);

      // Update context with retry count
      const updatedContext = {
        ...subscriber.context,
        retryCount,
      };

      // Schedule retry
      const retryKey = `${event.eventId}:${subscriber.id}`;
      const timeout = setTimeout(() => {
        // Remove from pending retries
        this.pendingRetries.delete(retryKey);

        // Only retry if subscriber is still active
        if (this.subscribers.has(subscriber.id) && this.subscribers.get(subscriber.id)!.active) {
          // Update subscriber context
          this.subscribers.get(subscriber.id)!.context = updatedContext;

          // Deliver event again
          this.deliverEventToSubscriber(this.subscribers.get(subscriber.id)!, event, message);
        }
      }, delay);

      // Store timeout for cleanup
      this.pendingRetries.set(retryKey, timeout);
    } else {
      // Max retries exceeded or error not retryable
      this.updateDeliveryStatus(event.eventId, subscriber.id, 'failed', error);
    }
  }

  /**
   * Delivers existing messages to a new subscriber
   * @param subscriber - The subscriber
   */
  private deliverExistingMessages(subscriber: IMockEventSubscriber): void {
    // Get all messages for this topic and partition
    const partition = subscriber.partition ?? 0;
    const topicPartitionKey = `${subscriber.topic}:${partition}`;
    const topicPartition = this.topicPartitions.get(topicPartitionKey);
    if (!topicPartition) {
      return;
    }

    // Get starting offset for this consumer group
    let startOffset = 0;
    if (subscriber.groupId) {
      const groupOffsetKey = `${subscriber.topic}:${partition}:${subscriber.groupId}`;
      startOffset = this.consumerGroupOffsets.get(groupOffsetKey) || 0;
    }

    // Deliver all messages from the starting offset
    for (const message of topicPartition.messages) {
      if (message.offset >= startOffset) {
        // Skip if this message has already been consumed by this consumer group
        if (subscriber.groupId && message.consumedBy.has(subscriber.groupId)) {
          continue;
        }

        // Deliver the event to the subscriber
        this.deliverEventToSubscriber(subscriber, message.event, message);

        // Mark as consumed by this consumer group
        if (subscriber.groupId) {
          message.consumedBy.add(subscriber.groupId);
        }
      }
    }
  }

  /**
   * Creates a mock event with the specified type and payload
   * @param type - The event type
   * @param payload - The event payload
   * @param metadata - Optional event metadata
   * @returns A base event object
   */
  static createMockEvent<T = any>(
    type: string,
    payload: T,
    metadata?: EventMetadata
  ): IBaseEvent<T> {
    return {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'mock-event-broker',
      type,
      payload,
      metadata,
    };
  }
}

/**
 * Factory for creating mock event handlers
 */
export class MockEventHandlerFactory {
  /**
   * Creates a mock event handler that always succeeds
   * @returns A mock event handler function
   */
  static createSuccessHandler(): (event: KafkaEvent) => Promise<IEventResponse> {
    return async (event: KafkaEvent) => {
      return createSuccessResponse({
        eventId: event.eventId,
        eventType: event.type,
        data: { processed: true },
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs: 10,
        },
      });
    };
  }

  /**
   * Creates a mock event handler that always fails
   * @param error - Optional error to return
   * @returns A mock event handler function
   */
  static createFailureHandler(error?: Error): (event: KafkaEvent) => Promise<IEventResponse> {
    return async (event: KafkaEvent) => {
      return createFailureResponse({
        eventId: event.eventId,
        eventType: event.type,
        error: {
          code: 'PROCESSING_ERROR',
          message: error?.message || 'Mock processing error',
          stack: error?.stack,
          retryable: false,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs: 10,
        },
      });
    };
  }

  /**
   * Creates a mock event handler that fails with a retryable error
   * @param error - Optional error to return
   * @returns A mock event handler function
   */
  static createRetryableHandler(error?: Error): (event: KafkaEvent) => Promise<IEventResponse> {
    return async (event: KafkaEvent) => {
      return createRetryResponse({
        eventId: event.eventId,
        eventType: event.type,
        error: {
          code: 'TEMPORARY_ERROR',
          message: error?.message || 'Temporary processing error',
          stack: error?.stack,
          retryable: true,
        },
        retryCount: 0,
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs: 10,
        },
      });
    };
  }

  /**
   * Creates a mock event handler that succeeds after a specified number of retries
   * @param successAfterRetries - Number of retries before succeeding
   * @returns A mock event handler function
   */
  static createEventualSuccessHandler(successAfterRetries: number): (event: KafkaEvent, context?: EventHandlerContext) => Promise<IEventResponse> {
    return async (event: KafkaEvent, context?: EventHandlerContext) => {
      const retryCount = context?.retryCount || 0;
      
      if (retryCount >= successAfterRetries) {
        return createSuccessResponse({
          eventId: event.eventId,
          eventType: event.type,
          data: { processed: true, retriesNeeded: retryCount },
          metadata: {
            timestamp: new Date().toISOString(),
            processingTimeMs: 10,
            retryCount,
          },
        });
      } else {
        return createRetryResponse({
          eventId: event.eventId,
          eventType: event.type,
          error: {
            code: 'TEMPORARY_ERROR',
            message: `Temporary error, retry ${retryCount + 1} of ${successAfterRetries}`,
            retryable: true,
          },
          retryCount,
          metadata: {
            timestamp: new Date().toISOString(),
            processingTimeMs: 10,
          },
        });
      }
    };
  }

  /**
   * Creates a mock event handler that throws an exception
   * @param error - Optional error to throw
   * @returns A mock event handler function
   */
  static createThrowingHandler(error?: Error): (event: KafkaEvent) => Promise<IEventResponse> {
    return async () => {
      throw error || new Error('Mock handler exception');
    };
  }
}
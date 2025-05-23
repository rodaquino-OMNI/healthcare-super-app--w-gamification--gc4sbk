/**
 * @file mock-kafka-consumer.ts
 * @description Mock implementation of a Kafka consumer for unit testing.
 * This file simulates the behavior of a KafkaJS Consumer with methods for
 * subscribing to topics, committing offsets, and processing messages.
 */

import { Subject, Observable, Subscription } from 'rxjs';
import { IKafkaConsumer, IKafkaConsumerOptions, IKafkaMessage, IKafkaTopicPartition } from '../../../../src/kafka/kafka.interfaces';

/**
 * Configuration options for the MockKafkaConsumer
 */
export interface MockKafkaConsumerOptions {
  /**
   * Whether the consumer should automatically connect when created
   * @default false
   */
  autoConnect?: boolean;

  /**
   * Whether to simulate connection errors
   * @default false
   */
  simulateConnectionError?: boolean;

  /**
   * Whether to simulate subscription errors
   * @default false
   */
  simulateSubscriptionError?: boolean;

  /**
   * Whether to simulate consumption errors
   * @default false
   */
  simulateConsumptionError?: boolean;

  /**
   * Whether to simulate commit errors
   * @default false
   */
  simulateCommitError?: boolean;

  /**
   * Consumer group ID
   * @default 'test-consumer-group'
   */
  groupId?: string;

  /**
   * Delay in milliseconds before delivering messages
   * @default 0
   */
  messageDeliveryDelay?: number;
}

/**
 * Mock implementation of a Kafka consumer for unit testing
 * Implements the IKafkaConsumer interface to provide a test double
 * that can be used in place of a real Kafka consumer
 */
export class MockKafkaConsumer implements IKafkaConsumer {
  private connected = false;
  private messageSubject = new Subject<IKafkaMessage<any>>();
  private subscribedTopics: string[] = [];
  private pausedTopicPartitions: IKafkaTopicPartition[] = [];
  private committedOffsets: Map<string, Map<number, string>> = new Map();
  private messageQueue: IKafkaMessage<any>[] = [];
  private activeSubscription: Subscription | null = null;
  private processingMessages = false;
  private errorCount = 0;
  private maxErrorRetries = 3;

  /**
   * Creates an instance of MockKafkaConsumer
   * @param options Configuration options for the mock consumer
   */
  constructor(private options: MockKafkaConsumerOptions = {}) {
    // Set default options
    this.options = {
      autoConnect: false,
      simulateConnectionError: false,
      simulateSubscriptionError: false,
      simulateConsumptionError: false,
      simulateCommitError: false,
      groupId: 'test-consumer-group',
      messageDeliveryDelay: 0,
      ...options
    };

    // Auto-connect if configured
    if (this.options.autoConnect) {
      this.connect().catch(err => {
        console.error('Failed to auto-connect mock consumer:', err);
      });
    }
  }

  /**
   * Connect to the Kafka broker (mock implementation)
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.options.simulateConnectionError) {
      throw new Error('Simulated connection error');
    }

    this.connected = true;
    return Promise.resolve();
  }

  /**
   * Disconnect from the Kafka broker (mock implementation)
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    // Clean up any active subscription
    if (this.activeSubscription) {
      this.activeSubscription.unsubscribe();
      this.activeSubscription = null;
    }

    this.connected = false;
    this.processingMessages = false;
    return Promise.resolve();
  }

  /**
   * Subscribe to Kafka topics (mock implementation)
   * @param topics Array of topics to subscribe to
   * @returns Promise that resolves when subscribed
   */
  async subscribe(topics: string[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Cannot subscribe: Consumer not connected');
    }

    if (this.options.simulateSubscriptionError) {
      throw new Error('Simulated subscription error');
    }

    // Store subscribed topics
    this.subscribedTopics = [...new Set([...this.subscribedTopics, ...topics])];
    return Promise.resolve();
  }

  /**
   * Consume messages from subscribed topics (mock implementation)
   * @param options Consumption options
   * @returns Observable that emits consumed messages
   */
  consume<T = any>(options?: IKafkaConsumerOptions): Observable<IKafkaMessage<T>> {
    if (!this.connected) {
      throw new Error('Cannot consume: Consumer not connected');
    }

    if (this.subscribedTopics.length === 0) {
      throw new Error('Cannot consume: No topics subscribed');
    }

    // Start processing messages from the queue
    this.processingMessages = true;
    this.processQueuedMessages();

    // Return the message subject as an observable
    return this.messageSubject as Observable<IKafkaMessage<T>>;
  }

  /**
   * Commit consumed message offsets (mock implementation)
   * @param message The message to commit
   * @returns Promise that resolves when offsets are committed
   */
  async commit(message: IKafkaMessage): Promise<void> {
    if (!this.connected) {
      throw new Error('Cannot commit: Consumer not connected');
    }

    if (this.options.simulateCommitError) {
      throw new Error('Simulated commit error');
    }

    const { topic, partition, offset } = message;
    
    if (!topic || partition === undefined || !offset) {
      throw new Error('Cannot commit: Missing topic, partition, or offset');
    }

    // Store the committed offset
    if (!this.committedOffsets.has(topic)) {
      this.committedOffsets.set(topic, new Map());
    }
    
    const topicOffsets = this.committedOffsets.get(topic)!;
    topicOffsets.set(partition, offset);

    return Promise.resolve();
  }

  /**
   * Seek to a specific offset in a partition (mock implementation)
   * @param topic The topic to seek in
   * @param partition The partition to seek in
   * @param offset The offset to seek to
   * @returns Promise that resolves when the seek is complete
   */
  async seek(topic: string, partition: number, offset: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Cannot seek: Consumer not connected');
    }

    if (!this.subscribedTopics.includes(topic)) {
      throw new Error(`Cannot seek: Not subscribed to topic ${topic}`);
    }

    // Update the committed offset for the topic-partition
    if (!this.committedOffsets.has(topic)) {
      this.committedOffsets.set(topic, new Map());
    }
    
    const topicOffsets = this.committedOffsets.get(topic)!;
    topicOffsets.set(partition, offset);

    return Promise.resolve();
  }

  /**
   * Pause consumption from specific topics/partitions (mock implementation)
   * @param topicPartitions Array of topic-partitions to pause
   * @returns Promise that resolves when consumption is paused
   */
  async pause(topicPartitions: IKafkaTopicPartition[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Cannot pause: Consumer not connected');
    }

    // Store paused topic-partitions
    this.pausedTopicPartitions = [
      ...this.pausedTopicPartitions,
      ...topicPartitions
    ];

    return Promise.resolve();
  }

  /**
   * Resume consumption from specific topics/partitions (mock implementation)
   * @param topicPartitions Array of topic-partitions to resume
   * @returns Promise that resolves when consumption is resumed
   */
  async resume(topicPartitions: IKafkaTopicPartition[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Cannot resume: Consumer not connected');
    }

    // Remove topic-partitions from paused list
    this.pausedTopicPartitions = this.pausedTopicPartitions.filter(tp => {
      return !topicPartitions.some(rtp => 
        rtp.topic === tp.topic && rtp.partition === tp.partition
      );
    });

    return Promise.resolve();
  }

  /**
   * Check if the consumer is connected (mock implementation)
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the list of subscribed topics
   * @returns Array of subscribed topics
   */
  getSubscribedTopics(): string[] {
    return [...this.subscribedTopics];
  }

  /**
   * Get the list of paused topic-partitions
   * @returns Array of paused topic-partitions
   */
  getPausedTopicPartitions(): IKafkaTopicPartition[] {
    return [...this.pausedTopicPartitions];
  }

  /**
   * Get the committed offsets
   * @returns Map of topic to partition to offset
   */
  getCommittedOffsets(): Map<string, Map<number, string>> {
    return new Map(Array.from(this.committedOffsets.entries()).map(
      ([topic, partitions]) => [topic, new Map(partitions)]
    ));
  }

  /**
   * Get the committed offset for a specific topic-partition
   * @param topic The topic
   * @param partition The partition
   * @returns The committed offset, or undefined if not committed
   */
  getCommittedOffset(topic: string, partition: number): string | undefined {
    return this.committedOffsets.get(topic)?.get(partition);
  }

  /**
   * Add a message to the queue for consumption
   * @param message The message to add
   */
  addMessage<T = any>(message: IKafkaMessage<T>): void {
    // Ensure the message has all required fields
    const completeMessage: IKafkaMessage<T> = {
      topic: message.topic || '',
      partition: message.partition !== undefined ? message.partition : 0,
      offset: message.offset || '0',
      key: message.key,
      value: message.value,
      headers: message.headers || {},
      timestamp: message.timestamp || new Date().toISOString(),
      ...message
    };

    // Add to the queue
    this.messageQueue.push(completeMessage as IKafkaMessage<any>);

    // Process the queue if we're actively consuming
    if (this.processingMessages) {
      this.processQueuedMessages();
    }
  }

  /**
   * Add multiple messages to the queue for consumption
   * @param messages The messages to add
   */
  addMessages<T = any>(messages: IKafkaMessage<T>[]): void {
    for (const message of messages) {
      this.addMessage(message);
    }
  }

  /**
   * Clear all queued messages
   */
  clearMessages(): void {
    this.messageQueue = [];
  }

  /**
   * Process messages in the queue
   */
  private processQueuedMessages(): void {
    if (!this.processingMessages || this.messageQueue.length === 0) {
      return;
    }

    // Process each message in the queue
    const messagesToProcess = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messagesToProcess) {
      // Skip messages for topics we're not subscribed to
      if (!this.subscribedTopics.includes(message.topic!)) {
        continue;
      }

      // Skip messages for paused topic-partitions
      if (this.isPaused(message.topic!, message.partition!)) {
        // Re-queue the message for later processing
        this.messageQueue.push(message);
        continue;
      }

      // Deliver the message after the configured delay
      setTimeout(() => {
        if (this.options.simulateConsumptionError && this.shouldSimulateError()) {
          // Simulate an error during consumption
          this.messageSubject.error(new Error('Simulated consumption error'));
          
          // Increment error count for retry tracking
          this.errorCount++;
          
          // Re-queue the message if we haven't exceeded max retries
          if (this.errorCount <= this.maxErrorRetries) {
            // Calculate exponential backoff delay
            const retryDelay = Math.min(100 * Math.pow(2, this.errorCount - 1), 30000);
            
            setTimeout(() => {
              // Reset error count after successful delivery
              this.errorCount = 0;
              this.messageSubject.next(message);
            }, retryDelay);
          } else {
            // Simulate sending to dead letter queue
            console.log(`Message sent to DLQ: ${JSON.stringify(message)}`);
            this.errorCount = 0;
          }
        } else {
          // Normal message delivery
          this.messageSubject.next(message);
          
          // Reset error count after successful delivery
          this.errorCount = 0;
        }
      }, this.options.messageDeliveryDelay || 0);
    }
  }

  /**
   * Check if a topic-partition is paused
   * @param topic The topic
   * @param partition The partition
   * @returns True if paused, false otherwise
   */
  private isPaused(topic: string, partition: number): boolean {
    return this.pausedTopicPartitions.some(tp => 
      tp.topic === topic && tp.partition === partition
    );
  }

  /**
   * Determine if we should simulate an error based on probability
   * @returns True if we should simulate an error, false otherwise
   */
  private shouldSimulateError(): boolean {
    // 20% chance of error
    return Math.random() < 0.2;
  }

  /**
   * Reset the consumer to its initial state
   */
  reset(): void {
    this.connected = false;
    this.subscribedTopics = [];
    this.pausedTopicPartitions = [];
    this.committedOffsets = new Map();
    this.messageQueue = [];
    this.processingMessages = false;
    this.errorCount = 0;
    
    if (this.activeSubscription) {
      this.activeSubscription.unsubscribe();
      this.activeSubscription = null;
    }
  }

  /**
   * Simulate a broker disconnection
   */
  simulateDisconnection(): void {
    if (!this.connected) {
      return;
    }

    this.connected = false;
    this.messageSubject.error(new Error('Simulated broker disconnection'));
  }

  /**
   * Simulate a rebalance event
   */
  simulateRebalance(): void {
    if (!this.connected) {
      return;
    }

    // Pause message processing during rebalance
    const wasProcessing = this.processingMessages;
    this.processingMessages = false;

    // Simulate a delay for the rebalance
    setTimeout(() => {
      // Resume message processing if it was active before
      this.processingMessages = wasProcessing;
      
      if (this.processingMessages) {
        this.processQueuedMessages();
      }
    }, 500);
  }

  /**
   * Set the maximum number of retries for error simulation
   * @param maxRetries The maximum number of retries
   */
  setMaxErrorRetries(maxRetries: number): void {
    this.maxErrorRetries = maxRetries;
  }

  /**
   * Get the current error count
   * @returns The current error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }
}
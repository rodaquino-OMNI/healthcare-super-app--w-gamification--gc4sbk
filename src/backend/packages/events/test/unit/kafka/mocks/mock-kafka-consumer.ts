/**
 * Mock implementation of a Kafka consumer for unit testing.
 * This file simulates the behavior of a KafkaJS Consumer with methods for
 * subscribing to topics, committing offsets, and processing messages.
 * It allows tests to trigger message consumption programmatically without
 * requiring a real Kafka connection.
 */

import { EventEmitter } from 'events';

/**
 * Interface for the mock Kafka message
 */
export interface MockKafkaMessage {
  key?: Buffer | string | null;
  value: Buffer | string | null;
  timestamp?: string;
  size?: number;
  attributes?: number;
  offset?: string;
  headers?: Record<string, any>;
}

/**
 * Interface for the mock Kafka batch
 */
export interface MockKafkaBatch {
  topic: string;
  partition: number;
  messages: MockKafkaMessage[];
  highWatermark?: string;
}

/**
 * Interface for the mock Kafka message payload
 */
export interface MockEachMessagePayload {
  topic: string;
  partition: number;
  message: MockKafkaMessage;
}

/**
 * Interface for the mock Kafka batch payload
 */
export interface MockEachBatchPayload {
  batch: MockKafkaBatch;
  resolveOffset: (offset: string) => void;
  heartbeat: () => Promise<void>;
  commitOffsetsIfNecessary: (offsets?: Record<string, any>) => Promise<void>;
  uncommittedOffsets: () => Record<string, any>;
  isRunning: () => boolean;
  isStale: () => boolean;
}

/**
 * Interface for the mock Kafka consumer run options
 */
export interface MockConsumerRunOptions {
  eachMessage?: (payload: MockEachMessagePayload) => Promise<void>;
  eachBatch?: (payload: MockEachBatchPayload) => Promise<void>;
  autoCommit?: boolean;
  autoCommitInterval?: number | null;
  autoCommitThreshold?: number | null;
  partitionsConsumedConcurrently?: number;
}

/**
 * Interface for the mock Kafka consumer subscribe options
 */
export interface MockConsumerSubscribeOptions {
  topic: string;
  fromBeginning?: boolean;
}

/**
 * Interface for the mock Kafka consumer configuration
 */
export interface MockConsumerConfig {
  groupId: string;
  metadataMaxAge?: number;
  sessionTimeout?: number;
  rebalanceTimeout?: number;
  heartbeatInterval?: number;
  maxBytesPerPartition?: number;
  minBytes?: number;
  maxBytes?: number;
  maxWaitTimeInMs?: number;
  retry?: RetryOptions;
  allowAutoTopicCreation?: boolean;
  maxInFlightRequests?: number;
  readUncommitted?: boolean;
}

/**
 * Interface for retry options
 */
export interface RetryOptions {
  maxRetryTime?: number;
  initialRetryTime?: number;
  factor?: number;
  multiplier?: number;
  retries?: number;
  restartOnFailure?: (error: Error) => Promise<boolean>;
}

/**
 * Interface for offset commit options
 */
export interface OffsetCommitOptions {
  topics: Array<{
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }>;
}

/**
 * Mock implementation of a Kafka consumer for unit testing
 */
export class MockKafkaConsumer extends EventEmitter {
  private connected: boolean = false;
  private running: boolean = false;
  private subscriptions: Map<string, { fromBeginning: boolean }> = new Map();
  private pausedTopics: Set<string> = new Set();
  private messageQueue: Map<string, MockKafkaMessage[]> = new Map();
  private deadLetterQueue: Map<string, MockKafkaMessage[]> = new Map();
  private committedOffsets: Map<string, Map<number, string>> = new Map();
  private runOptions: MockConsumerRunOptions | null = null;
  private shouldSimulateError: boolean = false;
  private errorToSimulate: Error | null = null;
  private retryCount: Map<string, number> = new Map();
  private maxRetries: number = 3;
  private retryBackoff: number = 100; // ms
  private groupId: string;

  /**
   * Creates a new MockKafkaConsumer instance
   * @param config - The consumer configuration
   */
  constructor(private config: MockConsumerConfig) {
    super();
    this.groupId = config.groupId;
    
    // Initialize retry options if provided
    if (config.retry) {
      this.maxRetries = config.retry.retries || this.maxRetries;
      this.retryBackoff = config.retry.initialRetryTime || this.retryBackoff;
    }
  }

  /**
   * Simulates connecting to Kafka
   * @returns A promise that resolves when the connection is established
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.shouldSimulateError && this.errorToSimulate) {
      throw this.errorToSimulate;
    }

    this.connected = true;
    this.emit('consumer.connect');
    return Promise.resolve();
  }

  /**
   * Simulates disconnecting from Kafka
   * @returns A promise that resolves when the connection is closed
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    if (this.shouldSimulateError && this.errorToSimulate) {
      throw this.errorToSimulate;
    }

    this.connected = false;
    this.running = false;
    this.emit('consumer.disconnect');
    return Promise.resolve();
  }

  /**
   * Simulates subscribing to a Kafka topic
   * @param options - The subscription options
   * @returns A promise that resolves when the subscription is complete
   */
  async subscribe(options: MockConsumerSubscribeOptions): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    if (this.shouldSimulateError && this.errorToSimulate) {
      throw this.errorToSimulate;
    }

    const { topic, fromBeginning = false } = options;
    this.subscriptions.set(topic, { fromBeginning });
    
    // Initialize message queue for this topic if it doesn't exist
    if (!this.messageQueue.has(topic)) {
      this.messageQueue.set(topic, []);
    }
    
    // Initialize dead letter queue for this topic if it doesn't exist
    if (!this.deadLetterQueue.has(topic)) {
      this.deadLetterQueue.set(topic, []);
    }

    this.emit('consumer.subscribe', { topic, fromBeginning });
    return Promise.resolve();
  }

  /**
   * Simulates running the consumer with message handlers
   * @param options - The consumer run options
   * @returns A promise that resolves when the consumer is running
   */
  async run(options: MockConsumerRunOptions): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    if (this.running) {
      throw new Error('Consumer is already running');
    }

    if (this.shouldSimulateError && this.errorToSimulate) {
      throw this.errorToSimulate;
    }

    this.runOptions = options;
    this.running = true;
    this.emit('consumer.run', options);
    return Promise.resolve();
  }

  /**
   * Simulates pausing consumption from specific topics
   * @param topics - Array of topics to pause
   */
  pause(topics: string[]): void {
    if (!this.running) {
      throw new Error('Consumer is not running');
    }

    topics.forEach(topic => {
      if (this.subscriptions.has(topic)) {
        this.pausedTopics.add(topic);
      }
    });

    this.emit('consumer.pause', topics);
  }

  /**
   * Returns the list of paused topics
   * @returns Array of paused topic names
   */
  paused(): string[] {
    return Array.from(this.pausedTopics);
  }

  /**
   * Simulates resuming consumption from specific topics
   * @param topics - Array of topics to resume
   */
  resume(topics: string[]): void {
    if (!this.running) {
      throw new Error('Consumer is not running');
    }

    topics.forEach(topic => {
      this.pausedTopics.delete(topic);
    });

    this.emit('consumer.resume', topics);
  }

  /**
   * Simulates committing offsets
   * @param offsets - The offsets to commit
   * @returns A promise that resolves when offsets are committed
   */
  async commitOffsets(offsets: OffsetCommitOptions): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    if (this.shouldSimulateError && this.errorToSimulate) {
      throw this.errorToSimulate;
    }

    // Store committed offsets for verification in tests
    for (const { topic, partitions } of offsets.topics) {
      if (!this.committedOffsets.has(topic)) {
        this.committedOffsets.set(topic, new Map());
      }

      const topicOffsets = this.committedOffsets.get(topic)!;
      for (const { partition, offset } of partitions) {
        topicOffsets.set(partition, offset);
      }
    }

    this.emit('consumer.commit_offsets', offsets);
    return Promise.resolve();
  }

  /**
   * Simulates seeking to a specific offset
   * @param topic - The topic to seek in
   * @param partition - The partition to seek in
   * @param offset - The offset to seek to
   * @returns A promise that resolves when the seek is complete
   */
  async seek({ topic, partition, offset }: { topic: string; partition: number; offset: string }): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    if (this.shouldSimulateError && this.errorToSimulate) {
      throw this.errorToSimulate;
    }

    if (!this.committedOffsets.has(topic)) {
      this.committedOffsets.set(topic, new Map());
    }

    const topicOffsets = this.committedOffsets.get(topic)!;
    topicOffsets.set(partition, offset);

    this.emit('consumer.seek', { topic, partition, offset });
    return Promise.resolve();
  }

  /**
   * Simulates stopping the consumer
   * @returns A promise that resolves when the consumer is stopped
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    if (this.shouldSimulateError && this.errorToSimulate) {
      throw this.errorToSimulate;
    }

    this.running = false;
    this.emit('consumer.stop');
    return Promise.resolve();
  }

  /**
   * Configures the consumer to simulate an error
   * @param error - The error to simulate
   */
  simulateError(error: Error): void {
    this.shouldSimulateError = true;
    this.errorToSimulate = error;
  }

  /**
   * Stops simulating errors
   */
  stopSimulatingError(): void {
    this.shouldSimulateError = false;
    this.errorToSimulate = null;
  }

  /**
   * Adds a message to the mock message queue for a specific topic
   * @param topic - The topic to add the message to
   * @param message - The message to add
   */
  addMessage(topic: string, message: MockKafkaMessage): void {
    if (!this.subscriptions.has(topic)) {
      throw new Error(`Not subscribed to topic: ${topic}`);
    }

    const messages = this.messageQueue.get(topic) || [];
    messages.push(message);
    this.messageQueue.set(topic, messages);
  }

  /**
   * Adds multiple messages to the mock message queue for a specific topic
   * @param topic - The topic to add the messages to
   * @param messages - The messages to add
   */
  addMessages(topic: string, messages: MockKafkaMessage[]): void {
    for (const message of messages) {
      this.addMessage(topic, message);
    }
  }

  /**
   * Processes the next message in the queue for a specific topic
   * @param topic - The topic to process a message from
   * @returns A promise that resolves when the message is processed
   */
  async processNextMessage(topic: string): Promise<boolean> {
    if (!this.running) {
      throw new Error('Consumer is not running');
    }

    if (!this.subscriptions.has(topic)) {
      throw new Error(`Not subscribed to topic: ${topic}`);
    }

    if (this.pausedTopics.has(topic)) {
      return false; // Topic is paused, don't process messages
    }

    const messages = this.messageQueue.get(topic) || [];
    if (messages.length === 0) {
      return false; // No messages to process
    }

    const message = messages.shift()!;
    this.messageQueue.set(topic, messages);

    if (!this.runOptions) {
      return false; // No handlers configured
    }

    try {
      if (this.runOptions.eachMessage) {
        const payload: MockEachMessagePayload = {
          topic,
          partition: 0, // Default partition for simplicity
          message: {
            ...message,
            offset: message.offset || '0',
          },
        };

        await this.runOptions.eachMessage(payload);
      } else if (this.runOptions.eachBatch) {
        const batch: MockKafkaBatch = {
          topic,
          partition: 0, // Default partition for simplicity
          messages: [{
            ...message,
            offset: message.offset || '0',
          }],
          highWatermark: '1',
        };

        const payload: MockEachBatchPayload = {
          batch,
          resolveOffset: (offset: string) => {
            // Implementation for resolving offset in tests
            if (!this.committedOffsets.has(topic)) {
              this.committedOffsets.set(topic, new Map());
            }
            this.committedOffsets.get(topic)!.set(0, offset);
          },
          heartbeat: async () => {
            // Mock heartbeat implementation
            this.emit('consumer.heartbeat', { groupId: this.groupId });
            return Promise.resolve();
          },
          commitOffsetsIfNecessary: async (offsets?: Record<string, any>) => {
            // Mock commit implementation
            if (offsets) {
              await this.commitOffsets({
                topics: [{
                  topic,
                  partitions: [{
                    partition: 0,
                    offset: message.offset || '0',
                  }],
                }],
              });
            }
            return Promise.resolve();
          },
          uncommittedOffsets: () => {
            // Return mock uncommitted offsets
            return {
              topics: [{
                topic,
                partitions: [{
                  partition: 0,
                  offset: message.offset || '0',
                }],
              }],
            };
          },
          isRunning: () => this.running,
          isStale: () => false,
        };

        await this.runOptions.eachBatch(payload);
      }

      // Auto-commit if enabled
      if (this.runOptions.autoCommit !== false) {
        await this.commitOffsets({
          topics: [{
            topic,
            partitions: [{
              partition: 0,
              offset: message.offset || '0',
            }],
          }],
        });
      }

      // Reset retry count for successful processing
      this.retryCount.delete(`${topic}-${message.offset}`);

      return true;
    } catch (error) {
      // Handle error with retry logic
      const messageId = `${topic}-${message.offset}`;
      const currentRetryCount = this.retryCount.get(messageId) || 0;

      if (currentRetryCount < this.maxRetries) {
        // Put the message back in the queue for retry
        const retryCount = currentRetryCount + 1;
        this.retryCount.set(messageId, retryCount);

        // Calculate exponential backoff delay
        const delay = this.retryBackoff * Math.pow(2, currentRetryCount);

        // Add the message back to the front of the queue after delay
        setTimeout(() => {
          const messages = this.messageQueue.get(topic) || [];
          messages.unshift(message);
          this.messageQueue.set(topic, messages);
          
          this.emit('consumer.retry', { 
            topic, 
            message, 
            error, 
            retryCount, 
            delay 
          });
        }, delay);
      } else {
        // Move to dead letter queue after max retries
        const dlqMessages = this.deadLetterQueue.get(topic) || [];
        dlqMessages.push(message);
        this.deadLetterQueue.set(topic, dlqMessages);
        
        this.emit('consumer.dead_letter', { 
          topic, 
          message, 
          error 
        });
      }

      // Re-throw the error for test assertions
      throw error;
    }
  }

  /**
   * Processes all messages in the queue for a specific topic
   * @param topic - The topic to process messages from
   * @returns A promise that resolves when all messages are processed
   */
  async processAllMessages(topic: string): Promise<number> {
    if (!this.running) {
      throw new Error('Consumer is not running');
    }

    let processedCount = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        hasMore = await this.processNextMessage(topic);
        if (hasMore) {
          processedCount++;
        }
      } catch (error) {
        // Continue processing other messages even if one fails
        hasMore = (this.messageQueue.get(topic)?.length || 0) > 0;
      }
    }

    return processedCount;
  }

  /**
   * Gets the committed offsets for verification in tests
   * @returns The committed offsets map
   */
  getCommittedOffsets(): Map<string, Map<number, string>> {
    return this.committedOffsets;
  }

  /**
   * Gets the dead letter queue for verification in tests
   * @returns The dead letter queue map
   */
  getDeadLetterQueue(): Map<string, MockKafkaMessage[]> {
    return this.deadLetterQueue;
  }

  /**
   * Gets the message queue for verification in tests
   * @returns The message queue map
   */
  getMessageQueue(): Map<string, MockKafkaMessage[]> {
    return this.messageQueue;
  }

  /**
   * Gets the retry counts for verification in tests
   * @returns The retry count map
   */
  getRetryCount(): Map<string, number> {
    return this.retryCount;
  }

  /**
   * Clears all queues and state for fresh testing
   */
  reset(): void {
    this.messageQueue.clear();
    this.deadLetterQueue.clear();
    this.committedOffsets.clear();
    this.retryCount.clear();
    this.pausedTopics.clear();
    this.subscriptions.clear();
    this.running = false;
    this.connected = false;
    this.shouldSimulateError = false;
    this.errorToSimulate = null;
    this.runOptions = null;
  }
}
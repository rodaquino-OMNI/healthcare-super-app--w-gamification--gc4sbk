/**
 * Mock implementation of a Kafka consumer for unit testing.
 * This class simulates the behavior of a KafkaJS Consumer with methods for
 * subscribing to topics, committing offsets, and processing messages.
 */

import { Consumer, ConsumerRunConfig, ConsumerSubscribeTopics, EachBatchPayload, EachMessagePayload } from 'kafkajs';

/**
 * Configuration options for the MockKafkaConsumer
 */
export interface MockKafkaConsumerConfig {
  /**
   * Group ID for the consumer
   */
  groupId: string;
  
  /**
   * Whether to simulate connection errors
   */
  simulateConnectionError?: boolean;
  
  /**
   * Whether to simulate processing errors
   */
  simulateProcessingError?: boolean;
  
  /**
   * Number of retries before succeeding (for testing retry mechanisms)
   */
  retriesBeforeSuccess?: number;
  
  /**
   * Whether to track offset commits
   */
  trackOffsets?: boolean;
  
  /**
   * Whether to use dead letter queue for failed messages
   */
  useDeadLetterQueue?: boolean;
}

/**
 * Topic partition offset for commit tracking
 */
export interface TopicPartitionOffset {
  topic: string;
  partition: number;
  offset: string;
}

/**
 * Message structure for the mock consumer
 */
export interface MockMessage {
  topic: string;
  partition: number;
  offset: string;
  key?: Buffer;
  value: Buffer;
  headers?: Record<string, string>;
  timestamp?: string;
}

/**
 * Mock implementation of a KafkaJS Consumer for unit testing
 */
export class MockKafkaConsumer implements Partial<Consumer> {
  private connected: boolean = false;
  private running: boolean = false;
  private subscriptions: Set<string> = new Set();
  private pausedTopicPartitions: Array<{ topic: string; partitions?: number[] }> = [];
  private messageHandler?: (payload: EachMessagePayload) => Promise<void>;
  private batchHandler?: (payload: EachBatchPayload) => Promise<void>;
  private messageQueue: MockMessage[] = [];
  private committedOffsets: TopicPartitionOffset[] = [];
  private retryCount: number = 0;
  private deadLetterQueue: MockMessage[] = [];
  private autoCommit: boolean = true;
  
  constructor(private config: MockKafkaConsumerConfig) {}
  
  /**
   * Simulates connecting to Kafka
   */
  async connect(): Promise<void> {
    if (this.config.simulateConnectionError) {
      throw new Error('Simulated connection error');
    }
    
    this.connected = true;
    return Promise.resolve();
  }
  
  /**
   * Simulates disconnecting from Kafka
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.running = false;
    return Promise.resolve();
  }
  
  /**
   * Simulates subscribing to topics
   */
  async subscribe(subscription: ConsumerSubscribeTopics): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }
    
    const { topics } = subscription;
    topics.forEach(topic => this.subscriptions.add(topic));
    
    return Promise.resolve();
  }
  
  /**
   * Simulates starting the consumer
   */
  async run(config: ConsumerRunConfig): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }
    
    this.running = true;
    this.messageHandler = config.eachMessage;
    this.batchHandler = config.eachBatch;
    this.autoCommit = config.autoCommit !== false;
    
    return Promise.resolve();
  }
  
  /**
   * Simulates pausing consumption from topic partitions
   */
  pause(topicPartitions: Array<{ topic: string; partitions?: number[] }>): void {
    if (!this.running) {
      throw new Error('Consumer not running');
    }
    
    this.pausedTopicPartitions = [
      ...this.pausedTopicPartitions,
      ...topicPartitions.filter(tp => 
        this.subscriptions.has(tp.topic) && 
        !this.pausedTopicPartitions.some(p => p.topic === tp.topic))
    ];
  }
  
  /**
   * Returns a list of paused topic partitions
   */
  paused(): Array<{ topic: string; partitions?: number[] }> {
    return [...this.pausedTopicPartitions];
  }
  
  /**
   * Simulates resuming consumption from paused topic partitions
   */
  resume(topicPartitions: Array<{ topic: string; partitions?: number[] }>): void {
    if (!this.running) {
      throw new Error('Consumer not running');
    }
    
    this.pausedTopicPartitions = this.pausedTopicPartitions.filter(tp => 
      !topicPartitions.some(p => p.topic === tp.topic));
  }
  
  /**
   * Simulates committing offsets
   */
  async commitOffsets(topicPartitions: TopicPartitionOffset[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }
    
    if (this.config.trackOffsets) {
      // Store committed offsets for verification in tests
      this.committedOffsets = [
        ...this.committedOffsets.filter(tp => 
          !topicPartitions.some(p => p.topic === tp.topic && p.partition === tp.partition)),
        ...topicPartitions
      ];
    }
    
    return Promise.resolve();
  }
  
  /**
   * Simulates seeking to a specific offset
   */
  seek({ topic, partition, offset }: { topic: string; partition: number; offset: string }): void {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }
    
    if (!this.subscriptions.has(topic)) {
      throw new Error(`Not subscribed to topic: ${topic}`);
    }
  }
  
  /**
   * Adds a message to the mock message queue for processing
   */
  addMessage(message: MockMessage): void {
    this.messageQueue.push(message);
  }
  
  /**
   * Adds multiple messages to the mock message queue for processing
   */
  addMessages(messages: MockMessage[]): void {
    this.messageQueue.push(...messages);
  }
  
  /**
   * Processes the next message in the queue
   */
  async processNextMessage(): Promise<boolean> {
    if (!this.running || !this.messageHandler || this.messageQueue.length === 0) {
      return false;
    }
    
    const message = this.messageQueue.shift();
    if (!message) return false;
    
    // Check if topic is paused
    if (this.pausedTopicPartitions.some(tp => tp.topic === message.topic)) {
      // Put the message back in the queue
      this.messageQueue.unshift(message);
      return false;
    }
    
    try {
      // Simulate processing error if configured
      if (this.config.simulateProcessingError) {
        if (this.config.retriesBeforeSuccess && this.retryCount < this.config.retriesBeforeSuccess) {
          this.retryCount++;
          throw new Error(`Simulated processing error (retry ${this.retryCount} of ${this.config.retriesBeforeSuccess})`);
        } else if (!this.config.retriesBeforeSuccess) {
          throw new Error('Simulated processing error');
        }
      }
      
      // Process the message
      await this.messageHandler({
        topic: message.topic,
        partition: message.partition,
        message: {
          key: message.key,
          value: message.value,
          headers: message.headers ? 
            Object.entries(message.headers).reduce((acc, [key, value]) => {
              acc[key] = Buffer.from(value);
              return acc;
            }, {} as Record<string, Buffer>) : 
            {},
          timestamp: message.timestamp || Date.now().toString(),
          offset: message.offset,
          size: message.value.length,
        },
      });
      
      // Auto-commit the offset if enabled
      if (this.autoCommit) {
        await this.commitOffsets([{
          topic: message.topic,
          partition: message.partition,
          offset: (parseInt(message.offset) + 1).toString(),
        }]);
      }
      
      return true;
    } catch (error) {
      // Handle the error based on configuration
      if (this.config.useDeadLetterQueue) {
        this.deadLetterQueue.push(message);
      } else if (this.config.retriesBeforeSuccess && this.retryCount < this.config.retriesBeforeSuccess) {
        // Put the message back in the queue for retry
        this.messageQueue.unshift(message);
      }
      
      throw error;
    }
  }
  
  /**
   * Processes all messages in the queue
   */
  async processAllMessages(): Promise<number> {
    let processedCount = 0;
    
    while (this.messageQueue.length > 0) {
      try {
        const processed = await this.processNextMessage();
        if (processed) processedCount++;
      } catch (error) {
        // If we're using retries, continue processing
        if (this.config.retriesBeforeSuccess && this.retryCount < this.config.retriesBeforeSuccess) {
          continue;
        }
        throw error;
      }
    }
    
    return processedCount;
  }
  
  /**
   * Processes messages in batches
   */
  async processBatch(batchSize: number = 10): Promise<number> {
    if (!this.running || !this.batchHandler || this.messageQueue.length === 0) {
      return 0;
    }
    
    // Take a batch of messages from the queue
    const batch = this.messageQueue.splice(0, batchSize);
    if (batch.length === 0) return 0;
    
    // Group messages by topic and partition
    const messagesByTopicPartition = batch.reduce((acc, message) => {
      const key = `${message.topic}-${message.partition}`;
      if (!acc[key]) {
        acc[key] = {
          topic: message.topic,
          partition: message.partition,
          messages: [],
        };
      }
      
      acc[key].messages.push({
        key: message.key,
        value: message.value,
        headers: message.headers ? 
          Object.entries(message.headers).reduce((acc, [key, value]) => {
            acc[key] = Buffer.from(value);
            return acc;
          }, {} as Record<string, Buffer>) : 
          {},
        timestamp: message.timestamp || Date.now().toString(),
        offset: message.offset,
        size: message.value.length,
      });
      
      return acc;
    }, {} as Record<string, { topic: string; partition: number; messages: any[] }>);
    
    // Process each topic-partition batch
    for (const key of Object.keys(messagesByTopicPartition)) {
      const { topic, partition, messages } = messagesByTopicPartition[key];
      
      // Check if topic is paused
      if (this.pausedTopicPartitions.some(tp => tp.topic === topic)) {
        // Put the messages back in the queue
        this.messageQueue.unshift(...batch.filter(m => m.topic === topic && m.partition === partition));
        continue;
      }
      
      try {
        // Simulate processing error if configured
        if (this.config.simulateProcessingError) {
          if (this.config.retriesBeforeSuccess && this.retryCount < this.config.retriesBeforeSuccess) {
            this.retryCount++;
            throw new Error(`Simulated batch processing error (retry ${this.retryCount} of ${this.config.retriesBeforeSuccess})`);
          } else if (!this.config.retriesBeforeSuccess) {
            throw new Error('Simulated batch processing error');
          }
        }
        
        // Find the highest offset in the batch
        const highWatermark = messages.reduce((max, msg) => {
          const offset = parseInt(msg.offset);
          return offset > max ? offset : max;
        }, -1).toString();
        
        // Create batch payload
        const batchPayload: EachBatchPayload = {
          batch: {
            topic,
            partition,
            highWatermark,
            messages,
          },
          resolveOffset: (offset: string) => {
            // Track resolved offsets for testing
            if (this.config.trackOffsets) {
              this.committedOffsets.push({
                topic,
                partition,
                offset: (parseInt(offset) + 1).toString(),
              });
            }
          },
          heartbeat: async () => Promise.resolve(),
          commitOffsetsIfNecessary: async () => {
            if (this.autoCommit) {
              await this.commitOffsets([{
                topic,
                partition,
                offset: (parseInt(highWatermark) + 1).toString(),
              }]);
            }
          },
          uncommittedOffsets: () => ({
            topics: [{
              topic,
              partitions: [{
                partition,
                offset: highWatermark,
              }],
            }],
          }),
          isRunning: () => this.running,
          isStale: () => false,
          pause: () => {
            this.pause([{ topic, partitions: [partition] }]);
            return () => this.resume([{ topic, partitions: [partition] }]);
          },
        };
        
        // Process the batch
        await this.batchHandler(batchPayload);
      } catch (error) {
        // Handle the error based on configuration
        if (this.config.useDeadLetterQueue) {
          this.deadLetterQueue.push(...batch.filter(m => m.topic === topic && m.partition === partition));
        } else if (this.config.retriesBeforeSuccess && this.retryCount < this.config.retriesBeforeSuccess) {
          // Put the messages back in the queue for retry
          this.messageQueue.unshift(...batch.filter(m => m.topic === topic && m.partition === partition));
        }
        
        throw error;
      }
    }
    
    return batch.length;
  }
  
  /**
   * Gets the committed offsets for testing verification
   */
  getCommittedOffsets(): TopicPartitionOffset[] {
    return [...this.committedOffsets];
  }
  
  /**
   * Gets the dead letter queue for testing verification
   */
  getDeadLetterQueue(): MockMessage[] {
    return [...this.deadLetterQueue];
  }
  
  /**
   * Clears the dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }
  
  /**
   * Resets the retry count
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }
  
  /**
   * Gets the current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }
  
  /**
   * Gets the current message queue length
   */
  getQueueLength(): number {
    return this.messageQueue.length;
  }
  
  /**
   * Checks if the consumer is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Checks if the consumer is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
/**
 * Mock implementation of a Kafka producer for unit testing.
 * This class simulates the behavior of a KafkaJS Producer with methods for
 * sending messages and managing transactions without requiring a real Kafka connection.
 */

import { Producer, ProducerBatch, ProducerRecord, RecordMetadata, Transaction } from 'kafkajs';
import { EventEmitter } from 'events';

/**
 * Configuration options for the MockKafkaProducer
 */
export interface MockKafkaProducerConfig {
  /**
   * Whether to simulate connection errors
   */
  simulateConnectionError?: boolean;
  
  /**
   * Whether to simulate send errors
   */
  simulateSendError?: boolean;
  
  /**
   * Number of retries before succeeding (for testing retry mechanisms)
   */
  retriesBeforeSuccess?: number;
  
  /**
   * Whether to track sent messages
   */
  trackSentMessages?: boolean;
  
  /**
   * Whether to simulate transaction errors
   */
  simulateTransactionError?: boolean;
  
  /**
   * Whether to emit events for producer lifecycle
   */
  emitEvents?: boolean;
}

/**
 * Record of a sent message for verification in tests
 */
export interface SentMessageRecord {
  /**
   * Topic the message was sent to
   */
  topic: string;
  
  /**
   * Partition the message was sent to (if specified)
   */
  partition?: number;
  
  /**
   * Message key
   */
  key?: Buffer | string | null;
  
  /**
   * Message value
   */
  value: Buffer | string | null;
  
  /**
   * Message headers
   */
  headers?: Record<string, string | Buffer>;
  
  /**
   * Timestamp when the message was sent
   */
  timestamp: string;
}

/**
 * Mock implementation of a KafkaJS Producer for unit testing
 */
export class MockKafkaProducer implements Partial<Producer> {
  private connected: boolean = false;
  private sentMessages: SentMessageRecord[] = [];
  private retryCount: number = 0;
  private eventEmitter: EventEmitter;
  private transactionInProgress: boolean = false;
  private transactionMessages: SentMessageRecord[] = [];
  
  constructor(private config: MockKafkaProducerConfig = {}) {
    this.eventEmitter = new EventEmitter();
  }
  
  /**
   * Simulates connecting to Kafka
   */
  async connect(): Promise<void> {
    if (this.config.simulateConnectionError) {
      throw new Error('Simulated connection error');
    }
    
    this.connected = true;
    
    if (this.config.emitEvents) {
      this.eventEmitter.emit('producer.connect');
    }
    
    return Promise.resolve();
  }
  
  /**
   * Simulates disconnecting from Kafka
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    
    if (this.config.emitEvents) {
      this.eventEmitter.emit('producer.disconnect');
    }
    
    return Promise.resolve();
  }
  
  /**
   * Simulates sending messages to Kafka
   * 
   * @param record - The record to send
   * @returns Promise resolving to record metadata
   */
  async send(record: ProducerRecord): Promise<RecordMetadata[]> {
    if (!this.connected) {
      throw new Error('Producer not connected');
    }
    
    // Simulate send error if configured
    if (this.config.simulateSendError) {
      if (this.config.retriesBeforeSuccess && this.retryCount < this.config.retriesBeforeSuccess) {
        this.retryCount++;
        throw new Error(`Simulated send error (retry ${this.retryCount} of ${this.config.retriesBeforeSuccess})`);
      } else if (!this.config.retriesBeforeSuccess) {
        throw new Error('Simulated send error');
      }
    }
    
    const { topic, messages, partition } = record;
    
    // Track sent messages if configured
    if (this.config.trackSentMessages) {
      const timestamp = new Date().toISOString();
      
      for (const message of messages) {
        const sentMessage: SentMessageRecord = {
          topic,
          partition,
          key: message.key,
          value: message.value,
          headers: message.headers,
          timestamp,
        };
        
        if (this.transactionInProgress) {
          this.transactionMessages.push(sentMessage);
        } else {
          this.sentMessages.push(sentMessage);
        }
      }
    }
    
    // Emit event if configured
    if (this.config.emitEvents) {
      this.eventEmitter.emit('producer.send', { topic, partition, messages });
    }
    
    // Create and return metadata
    const metadata: RecordMetadata[] = messages.map((_, index) => ({
      topicName: topic,
      partition: partition || 0,
      errorCode: 0,
      offset: String(this.sentMessages.length + index),
      timestamp: new Date().getTime().toString(),
    }));
    
    return metadata;
  }
  
  /**
   * Simulates sending messages in batches
   * 
   * @param batch - The batch to send
   * @returns Promise resolving to record metadata
   */
  async sendBatch(batch: ProducerBatch): Promise<RecordMetadata[]> {
    if (!this.connected) {
      throw new Error('Producer not connected');
    }
    
    // Simulate send error if configured
    if (this.config.simulateSendError) {
      if (this.config.retriesBeforeSuccess && this.retryCount < this.config.retriesBeforeSuccess) {
        this.retryCount++;
        throw new Error(`Simulated batch send error (retry ${this.retryCount} of ${this.config.retriesBeforeSuccess})`);
      } else if (!this.config.retriesBeforeSuccess) {
        throw new Error('Simulated batch send error');
      }
    }
    
    const allMetadata: RecordMetadata[] = [];
    
    // Process each topic-partition batch
    for (const topicBatch of batch.topicMessages) {
      const { topic, messages } = topicBatch;
      
      // Track sent messages if configured
      if (this.config.trackSentMessages) {
        const timestamp = new Date().toISOString();
        
        for (const message of messages) {
          const sentMessage: SentMessageRecord = {
            topic,
            partition: message.partition,
            key: message.key,
            value: message.value,
            headers: message.headers,
            timestamp,
          };
          
          if (this.transactionInProgress) {
            this.transactionMessages.push(sentMessage);
          } else {
            this.sentMessages.push(sentMessage);
          }
        }
      }
      
      // Create metadata for this batch
      const batchMetadata = messages.map((message, index) => ({
        topicName: topic,
        partition: message.partition || 0,
        errorCode: 0,
        offset: String(this.sentMessages.length + index),
        timestamp: new Date().getTime().toString(),
      }));
      
      allMetadata.push(...batchMetadata);
      
      // Emit event if configured
      if (this.config.emitEvents) {
        this.eventEmitter.emit('producer.send', { topic, messages });
      }
    }
    
    return allMetadata;
  }
  
  /**
   * Simulates creating a transaction
   * 
   * @returns A mock transaction object
   */
  transaction(): Transaction {
    if (!this.connected) {
      throw new Error('Producer not connected');
    }
    
    this.transactionInProgress = true;
    this.transactionMessages = [];
    
    // Create a mock transaction object
    const transaction: Transaction = {
      send: async (record: ProducerRecord) => {
        return this.send(record);
      },
      sendBatch: async (batch: ProducerBatch) => {
        return this.sendBatch(batch);
      },
      commit: async () => {
        if (this.config.simulateTransactionError) {
          throw new Error('Simulated transaction commit error');
        }
        
        // Move transaction messages to sent messages
        this.sentMessages.push(...this.transactionMessages);
        this.transactionMessages = [];
        this.transactionInProgress = false;
        
        if (this.config.emitEvents) {
          this.eventEmitter.emit('producer.transaction.commit');
        }
        
        return;
      },
      abort: async () => {
        if (this.config.simulateTransactionError) {
          throw new Error('Simulated transaction abort error');
        }
        
        // Discard transaction messages
        this.transactionMessages = [];
        this.transactionInProgress = false;
        
        if (this.config.emitEvents) {
          this.eventEmitter.emit('producer.transaction.abort');
        }
        
        return;
      },
      isActive: () => this.transactionInProgress,
    };
    
    return transaction;
  }
  
  /**
   * Registers an event listener
   * 
   * @param eventName - The event name to listen for
   * @param listener - The event listener function
   */
  on(eventName: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(eventName, listener);
  }
  
  /**
   * Gets all sent messages for verification in tests
   * 
   * @returns Array of sent message records
   */
  getSentMessages(): SentMessageRecord[] {
    return [...this.sentMessages];
  }
  
  /**
   * Gets sent messages for a specific topic
   * 
   * @param topic - The topic to get messages for
   * @returns Array of sent message records for the topic
   */
  getSentMessagesForTopic(topic: string): SentMessageRecord[] {
    return this.sentMessages.filter(message => message.topic === topic);
  }
  
  /**
   * Gets the current transaction messages
   * 
   * @returns Array of transaction message records
   */
  getTransactionMessages(): SentMessageRecord[] {
    return [...this.transactionMessages];
  }
  
  /**
   * Clears the sent messages history
   */
  clearSentMessages(): void {
    this.sentMessages = [];
  }
  
  /**
   * Resets the retry count
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }
  
  /**
   * Gets the current retry count
   * 
   * @returns The current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }
  
  /**
   * Checks if the producer is connected
   * 
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Checks if a transaction is in progress
   * 
   * @returns True if a transaction is in progress, false otherwise
   */
  isTransactionInProgress(): boolean {
    return this.transactionInProgress;
  }
  
  /**
   * Verifies that a specific message was sent
   * 
   * @param topic - The topic to check
   * @param predicate - Function to test each message
   * @returns True if a matching message was found, false otherwise
   */
  verifyMessageSent(topic: string, predicate: (message: SentMessageRecord) => boolean): boolean {
    return this.sentMessages.some(message => 
      message.topic === topic && predicate(message)
    );
  }
  
  /**
   * Counts the number of messages sent to a topic
   * 
   * @param topic - The topic to count messages for
   * @returns The number of messages sent to the topic
   */
  countMessagesSentToTopic(topic: string): number {
    return this.sentMessages.filter(message => message.topic === topic).length;
  }
}
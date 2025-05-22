/**
 * @file Kafka Test Setup Helper
 * @description Provides utilities for setting up mock Kafka producers and consumers for testing.
 * These utilities enable isolated testing of Kafka functionality without requiring a real Kafka cluster.
 */

import { jest } from '@jest/globals';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import {
  IKafkaConsumer,
  IKafkaProducer,
  IKafkaService,
  IKafkaMessage,
  IKafkaEventMessage,
  IKafkaConfig,
  IKafkaDeadLetterQueue,
  IKafkaHeaders,
  IKafkaProducerRecord,
  IKafkaProducerBatchRecord,
  IKafkaTransaction,
  IKafkaConsumerOptions,
  IKafkaTopicPartition,
  IKafkaMessageHandler,
  IKafkaEventHandler,
} from '../../../src/kafka/kafka.interfaces';

import { IBaseEvent } from '../../../src/interfaces/event.interface';
import { KafkaError, KafkaErrorType } from '../../../src/kafka/kafka.errors';

/**
 * In-memory message store for testing
 * Stores messages by topic and partition
 */
export class InMemoryMessageStore {
  private messages: Record<string, Record<number, IKafkaMessage[]>> = {};
  private offsets: Record<string, Record<number, number>> = {};

  /**
   * Store a message
   * @param message The message to store
   * @returns The offset of the stored message
   */
  storeMessage(message: IKafkaMessage): string {
    const topic = message.topic || 'default-topic';
    const partition = message.partition || 0;

    // Initialize topic and partition if they don't exist
    if (!this.messages[topic]) {
      this.messages[topic] = {};
      this.offsets[topic] = {};
    }

    if (!this.messages[topic][partition]) {
      this.messages[topic][partition] = [];
      this.offsets[topic][partition] = 0;
    }

    // Get the next offset for this partition
    const offset = this.offsets[topic][partition];
    this.offsets[topic][partition]++;

    // Store the message with its offset
    const messageWithOffset = {
      ...message,
      offset: String(offset),
      timestamp: message.timestamp || new Date().toISOString(),
    };

    this.messages[topic][partition].push(messageWithOffset);
    return String(offset);
  }

  /**
   * Store multiple messages
   * @param messages The messages to store
   * @returns The offsets of the stored messages
   */
  storeMessages(messages: IKafkaMessage[]): string[] {
    return messages.map(message => this.storeMessage(message));
  }

  /**
   * Get messages for a topic and partition
   * @param topic The topic to get messages for
   * @param partition The partition to get messages for
   * @param fromOffset The offset to start from
   * @param limit The maximum number of messages to return
   * @returns The messages for the topic and partition
   */
  getMessages(
    topic: string,
    partition: number = 0,
    fromOffset: number = 0,
    limit: number = Number.MAX_SAFE_INTEGER
  ): IKafkaMessage[] {
    if (!this.messages[topic] || !this.messages[topic][partition]) {
      return [];
    }

    return this.messages[topic][partition]
      .filter(message => Number(message.offset) >= fromOffset)
      .slice(0, limit);
  }

  /**
   * Get all messages for a topic across all partitions
   * @param topic The topic to get messages for
   * @returns All messages for the topic
   */
  getAllMessagesForTopic(topic: string): IKafkaMessage[] {
    if (!this.messages[topic]) {
      return [];
    }

    const result: IKafkaMessage[] = [];
    Object.values(this.messages[topic]).forEach(partitionMessages => {
      result.push(...partitionMessages);
    });

    // Sort by offset to simulate chronological order
    return result.sort((a, b) => Number(a.offset) - Number(b.offset));
  }

  /**
   * Get all topics
   * @returns All topics in the store
   */
  getTopics(): string[] {
    return Object.keys(this.messages);
  }

  /**
   * Get all partitions for a topic
   * @param topic The topic to get partitions for
   * @returns All partitions for the topic
   */
  getPartitions(topic: string): number[] {
    if (!this.messages[topic]) {
      return [];
    }

    return Object.keys(this.messages[topic]).map(Number);
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = {};
    this.offsets = {};
  }

  /**
   * Clear messages for a topic
   * @param topic The topic to clear messages for
   */
  clearTopic(topic: string): void {
    delete this.messages[topic];
    delete this.offsets[topic];
  }

  /**
   * Get the latest offset for a topic and partition
   * @param topic The topic to get the latest offset for
   * @param partition The partition to get the latest offset for
   * @returns The latest offset for the topic and partition
   */
  getLatestOffset(topic: string, partition: number = 0): string {
    if (!this.offsets[topic] || this.offsets[topic][partition] === undefined) {
      return '0';
    }

    return String(this.offsets[topic][partition] - 1);
  }
}

/**
 * Mock Kafka Producer for testing
 * Implements IKafkaProducer interface
 */
export class MockKafkaProducer implements IKafkaProducer {
  private connected = false;
  private messageStore: InMemoryMessageStore;
  private errorSimulation: Record<string, Error> = {};
  private delaySimulation: Record<string, number> = {};
  private transactionMode = false;
  private currentTransaction: MockKafkaTransaction | null = null;

  constructor(messageStore: InMemoryMessageStore) {
    this.messageStore = messageStore;
  }

  /**
   * Connect to the mock Kafka broker
   */
  async connect(): Promise<void> {
    this.connected = true;
    return Promise.resolve();
  }

  /**
   * Disconnect from the mock Kafka broker
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }

  /**
   * Send a message to a Kafka topic
   * @param message The message to send
   * @returns Promise that resolves with the message metadata
   */
  async send<T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord> {
    if (!this.connected) {
      throw new KafkaError(
        'Producer is not connected',
        KafkaErrorType.CONNECTION_ERROR,
        { topic: message.topic }
      );
    }

    const topic = message.topic || 'default-topic';

    // Check if we should simulate an error for this topic
    if (this.errorSimulation[topic]) {
      throw this.errorSimulation[topic];
    }

    // Check if we should simulate a delay for this topic
    if (this.delaySimulation[topic]) {
      await new Promise(resolve => setTimeout(resolve, this.delaySimulation[topic]));
    }

    // Store the message
    const partition = message.partition || 0;
    const offset = this.messageStore.storeMessage(message);

    return {
      topic,
      partition,
      offset,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send a batch of messages to Kafka topics
   * @param messages Array of messages to send
   * @returns Promise that resolves with the batch metadata
   */
  async sendBatch<T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord> {
    if (!this.connected) {
      throw new KafkaError(
        'Producer is not connected',
        KafkaErrorType.CONNECTION_ERROR
      );
    }

    const records: IKafkaProducerRecord[] = [];

    for (const message of messages) {
      try {
        const record = await this.send(message);
        records.push(record);
      } catch (error) {
        return {
          records,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    }

    return { records };
  }

  /**
   * Send an event to a Kafka topic
   * @param topic The topic to send to
   * @param event The event to send
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Promise that resolves with the message metadata
   */
  async sendEvent(
    topic: string,
    event: IBaseEvent,
    key?: string,
    headers?: IKafkaHeaders
  ): Promise<IKafkaProducerRecord> {
    return this.send({
      topic,
      key: key ? Buffer.from(key) : undefined,
      value: event,
      headers,
    });
  }

  /**
   * Begin a transaction
   * @returns Promise that resolves with a transaction object
   */
  async transaction(): Promise<IKafkaTransaction> {
    if (!this.connected) {
      throw new KafkaError(
        'Producer is not connected',
        KafkaErrorType.CONNECTION_ERROR
      );
    }

    this.transactionMode = true;
    this.currentTransaction = new MockKafkaTransaction(this.messageStore, this);
    return this.currentTransaction;
  }

  /**
   * Check if the producer is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Simulate an error for a topic
   * @param topic The topic to simulate an error for
   * @param error The error to simulate
   */
  simulateError(topic: string, error: Error): void {
    this.errorSimulation[topic] = error;
  }

  /**
   * Clear error simulation for a topic
   * @param topic The topic to clear error simulation for
   */
  clearErrorSimulation(topic: string): void {
    delete this.errorSimulation[topic];
  }

  /**
   * Clear all error simulations
   */
  clearAllErrorSimulations(): void {
    this.errorSimulation = {};
  }

  /**
   * Simulate a delay for a topic
   * @param topic The topic to simulate a delay for
   * @param delayMs The delay in milliseconds
   */
  simulateDelay(topic: string, delayMs: number): void {
    this.delaySimulation[topic] = delayMs;
  }

  /**
   * Clear delay simulation for a topic
   * @param topic The topic to clear delay simulation for
   */
  clearDelaySimulation(topic: string): void {
    delete this.delaySimulation[topic];
  }

  /**
   * Clear all delay simulations
   */
  clearAllDelaySimulations(): void {
    this.delaySimulation = {};
  }

  /**
   * Reset the producer to its initial state
   */
  reset(): void {
    this.connected = false;
    this.errorSimulation = {};
    this.delaySimulation = {};
    this.transactionMode = false;
    this.currentTransaction = null;
  }
}

/**
 * Mock Kafka Transaction for testing
 * Implements IKafkaTransaction interface
 */
export class MockKafkaTransaction implements IKafkaTransaction {
  private messageStore: InMemoryMessageStore;
  private producer: MockKafkaProducer;
  private pendingMessages: IKafkaMessage[] = [];
  private committed = false;
  private aborted = false;

  constructor(messageStore: InMemoryMessageStore, producer: MockKafkaProducer) {
    this.messageStore = messageStore;
    this.producer = producer;
  }

  /**
   * Send a message within this transaction
   * @param message The message to send
   * @returns Promise that resolves with the message metadata
   */
  async send<T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord> {
    if (this.committed || this.aborted) {
      throw new KafkaError(
        'Transaction already committed or aborted',
        KafkaErrorType.PRODUCER_ERROR
      );
    }

    // Store the message in the pending messages list
    this.pendingMessages.push(message as IKafkaMessage);

    // Return a mock record
    return {
      topic: message.topic || 'default-topic',
      partition: message.partition || 0,
      offset: 'pending',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send a batch of messages within this transaction
   * @param messages Array of messages to send
   * @returns Promise that resolves with the batch metadata
   */
  async sendBatch<T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord> {
    if (this.committed || this.aborted) {
      throw new KafkaError(
        'Transaction already committed or aborted',
        KafkaErrorType.PRODUCER_ERROR
      );
    }

    const records: IKafkaProducerRecord[] = [];

    for (const message of messages) {
      try {
        const record = await this.send(message);
        records.push(record);
      } catch (error) {
        return {
          records,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    }

    return { records };
  }

  /**
   * Commit the transaction
   * @returns Promise that resolves when the transaction is committed
   */
  async commit(): Promise<void> {
    if (this.committed || this.aborted) {
      throw new KafkaError(
        'Transaction already committed or aborted',
        KafkaErrorType.PRODUCER_ERROR
      );
    }

    // Store all pending messages in the message store
    for (const message of this.pendingMessages) {
      this.messageStore.storeMessage(message);
    }

    this.committed = true;
    return Promise.resolve();
  }

  /**
   * Abort the transaction
   * @returns Promise that resolves when the transaction is aborted
   */
  async abort(): Promise<void> {
    if (this.committed || this.aborted) {
      throw new KafkaError(
        'Transaction already committed or aborted',
        KafkaErrorType.PRODUCER_ERROR
      );
    }

    // Clear pending messages
    this.pendingMessages = [];
    this.aborted = true;
    return Promise.resolve();
  }

  /**
   * Check if the transaction is committed
   * @returns True if committed, false otherwise
   */
  isCommitted(): boolean {
    return this.committed;
  }

  /**
   * Check if the transaction is aborted
   * @returns True if aborted, false otherwise
   */
  isAborted(): boolean {
    return this.aborted;
  }
}

/**
 * Mock Kafka Consumer for testing
 * Implements IKafkaConsumer interface
 */
export class MockKafkaConsumer implements IKafkaConsumer {
  private connected = false;
  private messageStore: InMemoryMessageStore;
  private subscribedTopics: string[] = [];
  private messageSubject = new Subject<IKafkaMessage>();
  private consumptionActive = false;
  private consumerOptions: IKafkaConsumerOptions = {
    autoCommit: true,
    fromBeginning: false,
  };
  private offsets: Record<string, Record<number, string>> = {};
  private groupId: string;
  private errorSimulation: Record<string, Error> = {};
  private delaySimulation: Record<string, number> = {};
  private pausedTopicPartitions: Set<string> = new Set();

  constructor(messageStore: InMemoryMessageStore, groupId: string = 'test-group') {
    this.messageStore = messageStore;
    this.groupId = groupId;
  }

  /**
   * Connect to the mock Kafka broker
   */
  async connect(): Promise<void> {
    this.connected = true;
    return Promise.resolve();
  }

  /**
   * Disconnect from the mock Kafka broker
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.consumptionActive = false;
    return Promise.resolve();
  }

  /**
   * Subscribe to Kafka topics
   * @param topics Array of topics to subscribe to
   * @returns Promise that resolves when subscribed
   */
  async subscribe(topics: string[]): Promise<void> {
    if (!this.connected) {
      throw new KafkaError(
        'Consumer is not connected',
        KafkaErrorType.CONNECTION_ERROR
      );
    }

    // Check if we should simulate an error for any of these topics
    for (const topic of topics) {
      if (this.errorSimulation[topic]) {
        throw this.errorSimulation[topic];
      }
    }

    this.subscribedTopics = [...new Set([...this.subscribedTopics, ...topics])];
    return Promise.resolve();
  }

  /**
   * Consume messages from subscribed topics
   * @param options Consumption options
   * @returns Observable that emits consumed messages
   */
  consume<T = any>(options?: IKafkaConsumerOptions): Observable<IKafkaMessage<T>> {
    if (!this.connected) {
      throw new KafkaError(
        'Consumer is not connected',
        KafkaErrorType.CONNECTION_ERROR
      );
    }

    this.consumerOptions = { ...this.consumerOptions, ...options };
    this.consumptionActive = true;

    // Start consuming messages from the message store
    this.startConsumption();

    return this.messageSubject.asObservable() as Observable<IKafkaMessage<T>>;
  }

  /**
   * Commit consumed message offsets
   * @param message The message to commit
   * @returns Promise that resolves when offsets are committed
   */
  async commit(message: IKafkaMessage): Promise<void> {
    if (!this.connected) {
      throw new KafkaError(
        'Consumer is not connected',
        KafkaErrorType.CONNECTION_ERROR
      );
    }

    const topic = message.topic || 'default-topic';
    const partition = message.partition || 0;

    // Initialize topic and partition if they don't exist
    if (!this.offsets[topic]) {
      this.offsets[topic] = {};
    }

    // Store the offset + 1 (next offset to consume)
    this.offsets[topic][partition] = String(Number(message.offset) + 1);

    return Promise.resolve();
  }

  /**
   * Seek to a specific offset in a partition
   * @param topic The topic to seek in
   * @param partition The partition to seek in
   * @param offset The offset to seek to
   * @returns Promise that resolves when the seek is complete
   */
  async seek(topic: string, partition: number, offset: string): Promise<void> {
    if (!this.connected) {
      throw new KafkaError(
        'Consumer is not connected',
        KafkaErrorType.CONNECTION_ERROR
      );
    }

    // Initialize topic and partition if they don't exist
    if (!this.offsets[topic]) {
      this.offsets[topic] = {};
    }

    // Store the offset
    this.offsets[topic][partition] = offset;

    return Promise.resolve();
  }

  /**
   * Pause consumption from specific topics/partitions
   * @param topicPartitions Array of topic-partitions to pause
   * @returns Promise that resolves when consumption is paused
   */
  async pause(topicPartitions: IKafkaTopicPartition[]): Promise<void> {
    if (!this.connected) {
      throw new KafkaError(
        'Consumer is not connected',
        KafkaErrorType.CONNECTION_ERROR
      );
    }

    for (const { topic, partition } of topicPartitions) {
      this.pausedTopicPartitions.add(`${topic}-${partition}`);
    }

    return Promise.resolve();
  }

  /**
   * Resume consumption from specific topics/partitions
   * @param topicPartitions Array of topic-partitions to resume
   * @returns Promise that resolves when consumption is resumed
   */
  async resume(topicPartitions: IKafkaTopicPartition[]): Promise<void> {
    if (!this.connected) {
      throw new KafkaError(
        'Consumer is not connected',
        KafkaErrorType.CONNECTION_ERROR
      );
    }

    for (const { topic, partition } of topicPartitions) {
      this.pausedTopicPartitions.delete(`${topic}-${partition}`);
    }

    return Promise.resolve();
  }

  /**
   * Check if the consumer is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Start consuming messages from the message store
   * This is an internal method used to simulate message consumption
   */
  private startConsumption(): void {
    // This would typically be a continuous process in a real consumer
    // For testing, we'll just consume the current messages
    for (const topic of this.subscribedTopics) {
      const partitions = this.messageStore.getPartitions(topic);

      for (const partition of partitions) {
        // Skip paused topic-partitions
        if (this.pausedTopicPartitions.has(`${topic}-${partition}`)) {
          continue;
        }

        // Get the current offset for this topic-partition
        const fromOffset = this.getOffset(topic, partition);

        // Get messages from the store
        const messages = this.messageStore.getMessages(
          topic,
          partition,
          Number(fromOffset)
        );

        // Emit each message
        for (const message of messages) {
          // Check if we should simulate a delay for this topic
          if (this.delaySimulation[topic]) {
            setTimeout(() => {
              this.emitMessage(message);
            }, this.delaySimulation[topic]);
          } else {
            this.emitMessage(message);
          }
        }
      }
    }
  }

  /**
   * Emit a message to subscribers
   * @param message The message to emit
   */
  private emitMessage(message: IKafkaMessage): void {
    if (!this.consumptionActive) {
      return;
    }

    // Check if we should simulate an error for this topic
    if (this.errorSimulation[message.topic || 'default-topic']) {
      this.messageSubject.error(this.errorSimulation[message.topic || 'default-topic']);
      return;
    }

    this.messageSubject.next(message);

    // Auto-commit if enabled
    if (this.consumerOptions.autoCommit) {
      this.commit(message).catch(error => {
        console.error('Error auto-committing message:', error);
      });
    }
  }

  /**
   * Get the current offset for a topic and partition
   * @param topic The topic to get the offset for
   * @param partition The partition to get the offset for
   * @returns The current offset
   */
  private getOffset(topic: string, partition: number): string {
    if (!this.offsets[topic] || this.offsets[topic][partition] === undefined) {
      // If fromBeginning is true, start from offset 0, otherwise start from the latest
      return this.consumerOptions.fromBeginning ? '0' : this.messageStore.getLatestOffset(topic, partition);
    }

    return this.offsets[topic][partition];
  }

  /**
   * Simulate a new message arriving on a topic
   * @param message The message to simulate
   */
  simulateIncomingMessage(message: IKafkaMessage): void {
    const topic = message.topic || 'default-topic';
    const partition = message.partition || 0;

    // Store the message in the message store
    this.messageStore.storeMessage(message);

    // If we're subscribed to this topic and actively consuming, emit the message
    if (this.subscribedTopics.includes(topic) && this.consumptionActive) {
      // Skip paused topic-partitions
      if (this.pausedTopicPartitions.has(`${topic}-${partition}`)) {
        return;
      }

      this.emitMessage(message);
    }
  }

  /**
   * Simulate an error for a topic
   * @param topic The topic to simulate an error for
   * @param error The error to simulate
   */
  simulateError(topic: string, error: Error): void {
    this.errorSimulation[topic] = error;
  }

  /**
   * Clear error simulation for a topic
   * @param topic The topic to clear error simulation for
   */
  clearErrorSimulation(topic: string): void {
    delete this.errorSimulation[topic];
  }

  /**
   * Clear all error simulations
   */
  clearAllErrorSimulations(): void {
    this.errorSimulation = {};
  }

  /**
   * Simulate a delay for a topic
   * @param topic The topic to simulate a delay for
   * @param delayMs The delay in milliseconds
   */
  simulateDelay(topic: string, delayMs: number): void {
    this.delaySimulation[topic] = delayMs;
  }

  /**
   * Clear delay simulation for a topic
   * @param topic The topic to clear delay simulation for
   */
  clearDelaySimulation(topic: string): void {
    delete this.delaySimulation[topic];
  }

  /**
   * Clear all delay simulations
   */
  clearAllDelaySimulations(): void {
    this.delaySimulation = {};
  }

  /**
   * Get the consumer group ID
   * @returns The consumer group ID
   */
  getGroupId(): string {
    return this.groupId;
  }

  /**
   * Get the subscribed topics
   * @returns The subscribed topics
   */
  getSubscribedTopics(): string[] {
    return [...this.subscribedTopics];
  }

  /**
   * Get the committed offsets
   * @returns The committed offsets
   */
  getCommittedOffsets(): Record<string, Record<number, string>> {
    return { ...this.offsets };
  }

  /**
   * Reset the consumer to its initial state
   */
  reset(): void {
    this.connected = false;
    this.subscribedTopics = [];
    this.consumptionActive = false;
    this.consumerOptions = {
      autoCommit: true,
      fromBeginning: false,
    };
    this.offsets = {};
    this.errorSimulation = {};
    this.delaySimulation = {};
    this.pausedTopicPartitions.clear();
  }
}

/**
 * Mock Kafka Service for testing
 * Implements IKafkaService interface
 */
export class MockKafkaService implements IKafkaService {
  private connected = false;
  private messageStore: InMemoryMessageStore;
  private producer: MockKafkaProducer;
  private consumers: Map<string, MockKafkaConsumer> = new Map();
  private config: IKafkaConfig;

  constructor(config: IKafkaConfig) {
    this.config = config;
    this.messageStore = new InMemoryMessageStore();
    this.producer = new MockKafkaProducer(this.messageStore);
  }

  /**
   * Connect to the mock Kafka broker
   */
  async connect(): Promise<void> {
    this.connected = true;
    await this.producer.connect();
    return Promise.resolve();
  }

  /**
   * Disconnect from the mock Kafka broker
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    await this.producer.disconnect();

    // Disconnect all consumers
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }

    return Promise.resolve();
  }

  /**
   * Get a producer instance
   * @returns The Kafka producer
   */
  getProducer(): IKafkaProducer {
    return this.producer;
  }

  /**
   * Get a consumer instance
   * @param groupId Optional consumer group ID
   * @returns The Kafka consumer
   */
  getConsumer(groupId?: string): IKafkaConsumer {
    const consumerGroupId = groupId || this.config.groupId || 'default-group';

    // Create a new consumer if one doesn't exist for this group
    if (!this.consumers.has(consumerGroupId)) {
      const consumer = new MockKafkaConsumer(this.messageStore, consumerGroupId);
      this.consumers.set(consumerGroupId, consumer);

      // Connect the consumer if the service is connected
      if (this.connected) {
        consumer.connect().catch(error => {
          console.error(`Error connecting consumer for group ${consumerGroupId}:`, error);
        });
      }
    }

    return this.consumers.get(consumerGroupId)!;
  }

  /**
   * Check if the service is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the current configuration
   * @returns The current Kafka configuration
   */
  getConfig(): IKafkaConfig {
    return { ...this.config };
  }

  /**
   * Get the message store
   * @returns The message store
   */
  getMessageStore(): InMemoryMessageStore {
    return this.messageStore;
  }

  /**
   * Reset the service to its initial state
   */
  reset(): void {
    this.connected = false;
    this.producer.reset();

    // Reset all consumers
    for (const consumer of this.consumers.values()) {
      consumer.reset();
    }

    // Clear the message store
    this.messageStore.clear();
  }
}

/**
 * Mock Kafka Dead Letter Queue for testing
 * Implements IKafkaDeadLetterQueue interface
 */
export class MockKafkaDeadLetterQueue implements IKafkaDeadLetterQueue {
  private dlqStore: InMemoryMessageStore;
  private dlqPrefix: string;
  private producer: MockKafkaProducer;
  private originalProducer: MockKafkaProducer;

  constructor(
    messageStore: InMemoryMessageStore,
    originalProducer: MockKafkaProducer,
    dlqPrefix: string = 'dlq-'
  ) {
    this.dlqStore = new InMemoryMessageStore();
    this.dlqPrefix = dlqPrefix;
    this.producer = new MockKafkaProducer(this.dlqStore);
    this.originalProducer = originalProducer;
    this.producer.connect().catch(error => {
      console.error('Error connecting DLQ producer:', error);
    });
  }

  /**
   * Send a message to the dead letter queue
   * @param message The failed message
   * @param error The error that caused the failure
   * @param retryCount Number of retry attempts made
   * @returns Promise that resolves when the message is sent to DLQ
   */
  async sendToDLQ<T = any>(
    message: IKafkaMessage<T>,
    error: Error,
    retryCount: number
  ): Promise<void> {
    const topic = message.topic || 'default-topic';
    const dlqTopic = `${this.dlqPrefix}${topic}`;

    // Create a DLQ message with error information
    const dlqMessage: IKafkaMessage = {
      topic: dlqTopic,
      key: message.key,
      value: {
        originalMessage: {
          topic: message.topic,
          partition: message.partition,
          offset: message.offset,
          key: message.key ? Buffer.isBuffer(message.key) ? message.key.toString() : message.key : null,
          value: message.value,
          headers: message.headers,
          timestamp: message.timestamp,
        },
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        retryCount,
        timestamp: new Date().toISOString(),
      },
      headers: {
        'dlq-original-topic': topic,
        'dlq-error-type': error.name,
        'dlq-retry-count': String(retryCount),
        'dlq-timestamp': new Date().toISOString(),
      },
    };

    // Send the message to the DLQ
    await this.producer.send(dlqMessage);
  }

  /**
   * Retrieve messages from the dead letter queue
   * @param topic The original topic
   * @param limit Maximum number of messages to retrieve
   * @returns Promise that resolves with the retrieved messages
   */
  async retrieveFromDLQ<T = any>(topic: string, limit?: number): Promise<IKafkaMessage<T>[]> {
    const dlqTopic = `${this.dlqPrefix}${topic}`;
    const messages = this.dlqStore.getAllMessagesForTopic(dlqTopic);

    // Apply limit if specified
    const limitedMessages = limit ? messages.slice(0, limit) : messages;

    // Extract the original messages
    return limitedMessages.map(message => {
      const dlqValue = message.value as any;
      return dlqValue.originalMessage as IKafkaMessage<T>;
    });
  }

  /**
   * Retry processing a message from the dead letter queue
   * @param message The message to retry
   * @returns Promise that resolves when the message is reprocessed
   */
  async retryMessage<T = any>(message: IKafkaMessage<T>): Promise<void> {
    // Send the message back to the original topic
    await this.originalProducer.send(message);
  }

  /**
   * Retry all messages in the dead letter queue for a topic
   * @param topic The original topic
   * @returns Promise that resolves when all messages are reprocessed
   */
  async retryAllMessages(topic: string): Promise<void> {
    const messages = await this.retrieveFromDLQ(topic);

    // Retry each message
    for (const message of messages) {
      await this.retryMessage(message);
    }

    // Clear the DLQ for this topic
    const dlqTopic = `${this.dlqPrefix}${topic}`;
    this.dlqStore.clearTopic(dlqTopic);
  }

  /**
   * Get all DLQ topics
   * @returns All DLQ topics
   */
  getDLQTopics(): string[] {
    return this.dlqStore.getTopics();
  }

  /**
   * Get the number of messages in the DLQ for a topic
   * @param topic The original topic
   * @returns The number of messages in the DLQ
   */
  getDLQMessageCount(topic: string): number {
    const dlqTopic = `${this.dlqPrefix}${topic}`;
    return this.dlqStore.getAllMessagesForTopic(dlqTopic).length;
  }

  /**
   * Clear the DLQ for a topic
   * @param topic The original topic
   */
  clearDLQ(topic: string): void {
    const dlqTopic = `${this.dlqPrefix}${topic}`;
    this.dlqStore.clearTopic(dlqTopic);
  }

  /**
   * Clear all DLQs
   */
  clearAllDLQs(): void {
    this.dlqStore.clear();
  }
}

/**
 * Mock Kafka Message Handler for testing
 * Implements IKafkaMessageHandler interface
 */
export class MockKafkaMessageHandler<T = any> implements IKafkaMessageHandler<T> {
  private handleFn: jest.Mock;
  private handleBatchFn: jest.Mock | null = null;
  private handleErrorFn: jest.Mock | null = null;
  private processedMessages: IKafkaMessage<T>[] = [];
  private failedMessages: { message: IKafkaMessage<T>, error: Error }[] = [];

  constructor(
    handleFn?: (message: IKafkaMessage<T>, topic: string, partition: number) => Promise<void> | void,
    handleBatchFn?: (messages: IKafkaMessage<T>[], topic: string, partition: number) => Promise<void> | void,
    handleErrorFn?: (error: Error, message: IKafkaMessage<T>) => Promise<void> | void
  ) {
    this.handleFn = jest.fn(handleFn || (async () => {}));
    
    if (handleBatchFn) {
      this.handleBatchFn = jest.fn(handleBatchFn);
    }
    
    if (handleErrorFn) {
      this.handleErrorFn = jest.fn(handleErrorFn);
    }
  }

  /**
   * Handle a Kafka message
   * @param message The message to handle
   * @returns Promise that resolves when the message is handled
   */
  async handle(message: IKafkaMessage<T>): Promise<void> {
    try {
      await this.handleFn(message, message.topic || 'default-topic', message.partition || 0);
      this.processedMessages.push(message);
    } catch (error) {
      this.failedMessages.push({
        message,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      if (this.handleErrorFn) {
        await this.handleErrorFn(error instanceof Error ? error : new Error(String(error)), message);
      } else {
        throw error;
      }
    }
  }

  /**
   * Handle a batch of Kafka messages
   * @param messages Array of messages to handle
   * @returns Promise that resolves when all messages are handled
   */
  async handleBatch?(messages: IKafkaMessage<T>[]): Promise<void> {
    if (!this.handleBatchFn) {
      // Process messages individually if no batch handler is provided
      for (const message of messages) {
        await this.handle(message);
      }
      return;
    }

    try {
      // Group messages by topic and partition
      const messagesByTopicPartition: Record<string, IKafkaMessage<T>[]> = {};

      for (const message of messages) {
        const topic = message.topic || 'default-topic';
        const partition = message.partition || 0;
        const key = `${topic}-${partition}`;

        if (!messagesByTopicPartition[key]) {
          messagesByTopicPartition[key] = [];
        }

        messagesByTopicPartition[key].push(message);
      }

      // Process each group
      for (const [key, groupMessages] of Object.entries(messagesByTopicPartition)) {
        const [topic, partitionStr] = key.split('-');
        const partition = Number(partitionStr);

        await this.handleBatchFn(groupMessages, topic, partition);
        this.processedMessages.push(...groupMessages);
      }
    } catch (error) {
      // Mark all messages as failed
      for (const message of messages) {
        this.failedMessages.push({
          message,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      throw error;
    }
  }

  /**
   * Handle an error that occurred during message processing
   * @param error The error that occurred
   * @param message The message that caused the error
   * @returns Promise that resolves when the error is handled
   */
  async handleError?(error: Error, message: IKafkaMessage<T>): Promise<void> {
    if (this.handleErrorFn) {
      return this.handleErrorFn(error, message);
    }
  }

  /**
   * Get the mock handle function
   * @returns The mock handle function
   */
  getMockHandleFn(): jest.Mock {
    return this.handleFn;
  }

  /**
   * Get the mock handle batch function
   * @returns The mock handle batch function
   */
  getMockHandleBatchFn(): jest.Mock | null {
    return this.handleBatchFn;
  }

  /**
   * Get the mock handle error function
   * @returns The mock handle error function
   */
  getMockHandleErrorFn(): jest.Mock | null {
    return this.handleErrorFn;
  }

  /**
   * Get the processed messages
   * @returns The processed messages
   */
  getProcessedMessages(): IKafkaMessage<T>[] {
    return [...this.processedMessages];
  }

  /**
   * Get the failed messages
   * @returns The failed messages
   */
  getFailedMessages(): { message: IKafkaMessage<T>, error: Error }[] {
    return [...this.failedMessages];
  }

  /**
   * Reset the handler
   */
  reset(): void {
    this.handleFn.mockClear();
    if (this.handleBatchFn) {
      this.handleBatchFn.mockClear();
    }
    if (this.handleErrorFn) {
      this.handleErrorFn.mockClear();
    }
    this.processedMessages = [];
    this.failedMessages = [];
  }
}

/**
 * Mock Kafka Event Handler for testing
 * Implements IKafkaEventHandler interface
 */
export class MockKafkaEventHandler<T extends IBaseEvent = IBaseEvent> {
  private handleFn: jest.Mock;
  private handleBatchFn: jest.Mock | null = null;
  private handleErrorFn: jest.Mock | null = null;
  private processedEvents: T[] = [];
  private failedEvents: { event: T, error: Error }[] = [];

  constructor(
    handleFn?: (event: T, message: IKafkaEventMessage, topic: string, partition: number) => Promise<void> | void,
    handleBatchFn?: (events: T[], messages: IKafkaEventMessage[], topic: string, partition: number) => Promise<void> | void,
    handleErrorFn?: (error: Error, event: T, message: IKafkaEventMessage) => Promise<void> | void
  ) {
    this.handleFn = jest.fn(handleFn || (async () => {}));
    
    if (handleBatchFn) {
      this.handleBatchFn = jest.fn(handleBatchFn);
    }
    
    if (handleErrorFn) {
      this.handleErrorFn = jest.fn(handleErrorFn);
    }
  }

  /**
   * Handle a Kafka event message
   * @param message The event message to handle
   * @returns Promise that resolves when the event is handled
   */
  async handle(message: IKafkaEventMessage): Promise<void> {
    try {
      const event = message.value as T;
      await this.handleFn(event, message, message.topic || 'default-topic', message.partition || 0);
      this.processedEvents.push(event);
    } catch (error) {
      this.failedEvents.push({
        event: message.value as T,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      if (this.handleErrorFn) {
        await this.handleErrorFn(
          error instanceof Error ? error : new Error(String(error)),
          message.value as T,
          message
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Handle a batch of Kafka event messages
   * @param messages Array of event messages to handle
   * @returns Promise that resolves when all events are handled
   */
  async handleBatch?(messages: IKafkaEventMessage[]): Promise<void> {
    if (!this.handleBatchFn) {
      // Process messages individually if no batch handler is provided
      for (const message of messages) {
        await this.handle(message);
      }
      return;
    }

    try {
      // Group messages by topic and partition
      const messagesByTopicPartition: Record<string, IKafkaEventMessage[]> = {};

      for (const message of messages) {
        const topic = message.topic || 'default-topic';
        const partition = message.partition || 0;
        const key = `${topic}-${partition}`;

        if (!messagesByTopicPartition[key]) {
          messagesByTopicPartition[key] = [];
        }

        messagesByTopicPartition[key].push(message);
      }

      // Process each group
      for (const [key, groupMessages] of Object.entries(messagesByTopicPartition)) {
        const [topic, partitionStr] = key.split('-');
        const partition = Number(partitionStr);

        const events = groupMessages.map(message => message.value as T);
        await this.handleBatchFn(events, groupMessages, topic, partition);
        this.processedEvents.push(...events);
      }
    } catch (error) {
      // Mark all events as failed
      for (const message of messages) {
        this.failedEvents.push({
          event: message.value as T,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      throw error;
    }
  }

  /**
   * Handle an error that occurred during event processing
   * @param error The error that occurred
   * @param event The event that caused the error
   * @param message The message that caused the error
   * @returns Promise that resolves when the error is handled
   */
  async handleError?(error: Error, event: T, message: IKafkaEventMessage): Promise<void> {
    if (this.handleErrorFn) {
      return this.handleErrorFn(error, event, message);
    }
  }

  /**
   * Get the mock handle function
   * @returns The mock handle function
   */
  getMockHandleFn(): jest.Mock {
    return this.handleFn;
  }

  /**
   * Get the mock handle batch function
   * @returns The mock handle batch function
   */
  getMockHandleBatchFn(): jest.Mock | null {
    return this.handleBatchFn;
  }

  /**
   * Get the mock handle error function
   * @returns The mock handle error function
   */
  getMockHandleErrorFn(): jest.Mock | null {
    return this.handleErrorFn;
  }

  /**
   * Get the processed events
   * @returns The processed events
   */
  getProcessedEvents(): T[] {
    return [...this.processedEvents];
  }

  /**
   * Get the failed events
   * @returns The failed events
   */
  getFailedEvents(): { event: T, error: Error }[] {
    return [...this.failedEvents];
  }

  /**
   * Reset the handler
   */
  reset(): void {
    this.handleFn.mockClear();
    if (this.handleBatchFn) {
      this.handleBatchFn.mockClear();
    }
    if (this.handleErrorFn) {
      this.handleErrorFn.mockClear();
    }
    this.processedEvents = [];
    this.failedEvents = [];
  }
}

/**
 * Create a mock Kafka service for testing
 * @param config Optional Kafka configuration
 * @returns A mock Kafka service
 */
export function createMockKafkaService(config: Partial<IKafkaConfig> = {}): MockKafkaService {
  const defaultConfig: IKafkaConfig = {
    brokers: ['localhost:9092'],
    clientId: 'test-client',
    groupId: 'test-group',
  };

  return new MockKafkaService({ ...defaultConfig, ...config });
}

/**
 * Create a mock Kafka producer for testing
 * @param messageStore Optional message store to use
 * @returns A mock Kafka producer
 */
export function createMockKafkaProducer(messageStore?: InMemoryMessageStore): MockKafkaProducer {
  return new MockKafkaProducer(messageStore || new InMemoryMessageStore());
}

/**
 * Create a mock Kafka consumer for testing
 * @param messageStore Optional message store to use
 * @param groupId Optional consumer group ID
 * @returns A mock Kafka consumer
 */
export function createMockKafkaConsumer(
  messageStore?: InMemoryMessageStore,
  groupId: string = 'test-group'
): MockKafkaConsumer {
  return new MockKafkaConsumer(messageStore || new InMemoryMessageStore(), groupId);
}

/**
 * Create a mock Kafka dead letter queue for testing
 * @param messageStore Optional message store to use
 * @param producer Optional producer to use
 * @param dlqPrefix Optional DLQ topic prefix
 * @returns A mock Kafka dead letter queue
 */
export function createMockKafkaDeadLetterQueue(
  messageStore?: InMemoryMessageStore,
  producer?: MockKafkaProducer,
  dlqPrefix: string = 'dlq-'
): MockKafkaDeadLetterQueue {
  const store = messageStore || new InMemoryMessageStore();
  const kafkaProducer = producer || new MockKafkaProducer(store);
  return new MockKafkaDeadLetterQueue(store, kafkaProducer, dlqPrefix);
}

/**
 * Create a mock Kafka message handler for testing
 * @param handleFn Optional function to handle messages
 * @param handleBatchFn Optional function to handle batches of messages
 * @param handleErrorFn Optional function to handle errors
 * @returns A mock Kafka message handler
 */
export function createMockKafkaMessageHandler<T = any>(
  handleFn?: (message: IKafkaMessage<T>, topic: string, partition: number) => Promise<void> | void,
  handleBatchFn?: (messages: IKafkaMessage<T>[], topic: string, partition: number) => Promise<void> | void,
  handleErrorFn?: (error: Error, message: IKafkaMessage<T>) => Promise<void> | void
): MockKafkaMessageHandler<T> {
  return new MockKafkaMessageHandler<T>(handleFn, handleBatchFn, handleErrorFn);
}

/**
 * Create a mock Kafka event handler for testing
 * @param handleFn Optional function to handle events
 * @param handleBatchFn Optional function to handle batches of events
 * @param handleErrorFn Optional function to handle errors
 * @returns A mock Kafka event handler
 */
export function createMockKafkaEventHandler<T extends IBaseEvent = IBaseEvent>(
  handleFn?: (event: T, message: IKafkaEventMessage, topic: string, partition: number) => Promise<void> | void,
  handleBatchFn?: (events: T[], messages: IKafkaEventMessage[], topic: string, partition: number) => Promise<void> | void,
  handleErrorFn?: (error: Error, event: T, message: IKafkaEventMessage) => Promise<void> | void
): MockKafkaEventHandler<T> {
  return new MockKafkaEventHandler<T>(handleFn, handleBatchFn, handleErrorFn);
}

/**
 * Create a mock Kafka message
 * @param topic The topic for the message
 * @param value The message value
 * @param key Optional message key
 * @param partition Optional partition
 * @param headers Optional headers
 * @returns A mock Kafka message
 */
export function createMockKafkaMessage<T = any>(
  topic: string,
  value: T,
  key?: string,
  partition: number = 0,
  headers?: IKafkaHeaders
): IKafkaMessage<T> {
  return {
    topic,
    partition,
    key: key ? Buffer.from(key) : undefined,
    value,
    headers,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a mock Kafka event message
 * @param topic The topic for the message
 * @param event The event payload
 * @param key Optional message key
 * @param partition Optional partition
 * @param headers Optional headers
 * @returns A mock Kafka event message
 */
export function createMockKafkaEventMessage<T extends IBaseEvent = IBaseEvent>(
  topic: string,
  event: T,
  key?: string,
  partition: number = 0,
  headers?: IKafkaHeaders
): IKafkaEventMessage {
  return {
    topic,
    partition,
    key: key ? Buffer.from(key) : undefined,
    value: event,
    headers,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wait for a specified number of messages to be processed by a handler
 * @param handler The message handler to wait for
 * @param count The number of messages to wait for
 * @param timeoutMs Optional timeout in milliseconds
 * @returns Promise that resolves when the specified number of messages have been processed
 */
export async function waitForProcessedMessages<T = any>(
  handler: MockKafkaMessageHandler<T>,
  count: number,
  timeoutMs: number = 5000
): Promise<IKafkaMessage<T>[]> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (handler.getProcessedMessages().length >= count) {
      return handler.getProcessedMessages();
    }
    
    // Wait a short time before checking again
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  throw new Error(`Timeout waiting for ${count} messages to be processed. Only received ${handler.getProcessedMessages().length}.`);
}

/**
 * Wait for a specified number of events to be processed by a handler
 * @param handler The event handler to wait for
 * @param count The number of events to wait for
 * @param timeoutMs Optional timeout in milliseconds
 * @returns Promise that resolves when the specified number of events have been processed
 */
export async function waitForProcessedEvents<T extends IBaseEvent = IBaseEvent>(
  handler: MockKafkaEventHandler<T>,
  count: number,
  timeoutMs: number = 5000
): Promise<T[]> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (handler.getProcessedEvents().length >= count) {
      return handler.getProcessedEvents();
    }
    
    // Wait a short time before checking again
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  throw new Error(`Timeout waiting for ${count} events to be processed. Only received ${handler.getProcessedEvents().length}.`);
}

/**
 * Wait for a specified number of messages to be sent to the DLQ
 * @param dlq The dead letter queue to wait for
 * @param topic The topic to wait for messages from
 * @param count The number of messages to wait for
 * @param timeoutMs Optional timeout in milliseconds
 * @returns Promise that resolves when the specified number of messages have been sent to the DLQ
 */
export async function waitForDLQMessages<T = any>(
  dlq: MockKafkaDeadLetterQueue,
  topic: string,
  count: number,
  timeoutMs: number = 5000
): Promise<IKafkaMessage<T>[]> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const messages = await dlq.retrieveFromDLQ<T>(topic);
    if (messages.length >= count) {
      return messages;
    }
    
    // Wait a short time before checking again
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  const messages = await dlq.retrieveFromDLQ<T>(topic);
  throw new Error(`Timeout waiting for ${count} messages in DLQ for topic ${topic}. Only received ${messages.length}.`);
}

/**
 * Setup a complete Kafka testing environment
 * @param config Optional Kafka configuration
 * @returns A complete Kafka testing environment
 */
export function setupKafkaTestEnvironment(config: Partial<IKafkaConfig> = {}): {
  service: MockKafkaService;
  producer: MockKafkaProducer;
  consumer: MockKafkaConsumer;
  messageStore: InMemoryMessageStore;
  dlq: MockKafkaDeadLetterQueue;
} {
  const service = createMockKafkaService(config);
  const messageStore = service.getMessageStore();
  const producer = service.getProducer() as MockKafkaProducer;
  const consumer = service.getConsumer() as MockKafkaConsumer;
  const dlq = createMockKafkaDeadLetterQueue(messageStore, producer);
  
  // Connect everything
  service.connect().catch(error => {
    console.error('Error connecting Kafka service:', error);
  });
  
  return {
    service,
    producer,
    consumer,
    messageStore,
    dlq,
  };
}

/**
 * Create a test event for use in tests
 * @param type The event type
 * @param payload The event payload
 * @param source Optional event source
 * @returns A test event
 */
export function createTestEvent<T extends Record<string, any> = Record<string, any>>(
  type: string,
  payload: T,
  source: string = 'test'
): IBaseEvent & T {
  return {
    id: uuidv4(),
    type,
    source,
    timestamp: new Date().toISOString(),
    ...payload,
  };
}
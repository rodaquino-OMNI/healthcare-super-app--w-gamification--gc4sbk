/**
 * @file kafka-test-client.ts
 * @description Provides a mock Kafka client implementation for testing event publishing and consuming
 * without requiring a real Kafka connection. It allows simulation of Kafka behavior, testing of
 * produce/consume patterns, and verification of event handling logic in isolated test environments.
 */

import { Subject, Observable, of, throwError } from 'rxjs';
import { delay, filter, map, mergeMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { BaseEvent } from '../../src/interfaces/base-event.interface';
import {
  IKafkaMessage,
  IKafkaProducer,
  IKafkaConsumer,
  IKafkaConfig,
  IKafkaHeaders,
  IKafkaProducerRecord,
  IKafkaProducerBatchRecord,
  IKafkaTransaction,
  IKafkaConsumerOptions,
  IKafkaTopicPartition,
  IKafkaDeadLetterQueue,
} from '../../src/kafka/kafka.interfaces';

/**
 * Interface for configuring the test Kafka client
 */
export interface KafkaTestClientConfig {
  /**
   * Default delivery delay in milliseconds
   * @default 10
   */
  defaultDeliveryDelayMs?: number;

  /**
   * Whether to log operations to console
   * @default false
   */
  enableLogging?: boolean;

  /**
   * Whether to simulate network errors randomly
   * @default false
   */
  simulateNetworkErrors?: boolean;

  /**
   * Probability of network error (0-1)
   * @default 0.05
   */
  networkErrorProbability?: number;

  /**
   * Whether to simulate broker failures
   * @default false
   */
  simulateBrokerFailures?: boolean;

  /**
   * Whether to enable dead letter queue functionality
   * @default true
   */
  enableDeadLetterQueue?: boolean;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetryAttempts?: number;

  /**
   * Initial retry delay in milliseconds
   * @default 100
   */
  initialRetryDelayMs?: number;

  /**
   * Retry backoff factor
   * @default 2
   */
  retryBackoffFactor?: number;

  /**
   * Whether to track message ordering
   * @default true
   */
  trackMessageOrdering?: boolean;

  /**
   * Whether to validate message schemas
   * @default false
   */
  validateMessageSchemas?: boolean;
}

/**
 * Interface for message delivery options
 */
export interface MessageDeliveryOptions {
  /**
   * Delay before delivering the message in milliseconds
   */
  delayMs?: number;

  /**
   * Whether to simulate a delivery error
   */
  simulateError?: boolean;

  /**
   * Custom error to throw if simulating an error
   */
  errorToThrow?: Error;

  /**
   * Partition to deliver the message to
   */
  partition?: number;
}

/**
 * Interface for error injection options
 */
export interface ErrorInjectionOptions {
  /**
   * Topic to inject errors for
   */
  topic: string;

  /**
   * Partition to inject errors for (optional)
   */
  partition?: number;

  /**
   * Error to throw
   */
  error: Error;

  /**
   * Number of messages to affect
   * @default 1
   */
  count?: number;

  /**
   * Whether to clear the error after it's been triggered
   * @default true
   */
  clearAfterTrigger?: boolean;
}

/**
 * Interface for message audit record
 */
export interface MessageAuditRecord<T = any> {
  /**
   * Message ID
   */
  id: string;

  /**
   * Topic the message was sent to
   */
  topic: string;

  /**
   * Partition the message was sent to
   */
  partition: number;

  /**
   * Message key
   */
  key?: string | Buffer;

  /**
   * Message headers
   */
  headers?: IKafkaHeaders;

  /**
   * Message value
   */
  value: T;

  /**
   * Timestamp when the message was produced
   */
  producedAt: string;

  /**
   * Timestamp when the message was consumed (if applicable)
   */
  consumedAt?: string;

  /**
   * Number of delivery attempts
   */
  deliveryAttempts: number;

  /**
   * Whether the message was successfully delivered
   */
  delivered: boolean;

  /**
   * Error that occurred during delivery (if any)
   */
  error?: Error;

  /**
   * Whether the message was sent to the dead letter queue
   */
  sentToDLQ: boolean;
}

/**
 * Interface for dead letter queue record
 */
export interface DeadLetterQueueRecord<T = any> {
  /**
   * Original message
   */
  originalMessage: IKafkaMessage<T>;

  /**
   * Error that caused the message to be sent to DLQ
   */
  error: Error;

  /**
   * Number of retry attempts made
   */
  retryCount: number;

  /**
   * Timestamp when the message was sent to DLQ
   */
  timestamp: string;

  /**
   * Original topic
   */
  originalTopic: string;

  /**
   * Original partition
   */
  originalPartition: number;
}

/**
 * A mock Kafka client for testing purposes
 * Simulates Kafka behavior without requiring a real Kafka connection
 */
export class KafkaTestClient {
  private config: Required<KafkaTestClientConfig>;
  private connected = false;
  private messageSubjects: Map<string, Subject<IKafkaMessage>> = new Map();
  private topicPartitions: Map<string, number[]> = new Map();
  private messageAudit: MessageAuditRecord[] = [];
  private deadLetterQueue: Map<string, DeadLetterQueueRecord[]> = new Map();
  private injectedErrors: ErrorInjectionOptions[] = [];
  private producer: MockKafkaProducer;
  private consumers: Map<string, MockKafkaConsumer> = new Map();

  /**
   * Creates a new KafkaTestClient instance
   * @param config Configuration options
   */
  constructor(config: KafkaTestClientConfig = {}) {
    this.config = {
      defaultDeliveryDelayMs: config.defaultDeliveryDelayMs ?? 10,
      enableLogging: config.enableLogging ?? false,
      simulateNetworkErrors: config.simulateNetworkErrors ?? false,
      networkErrorProbability: config.networkErrorProbability ?? 0.05,
      simulateBrokerFailures: config.simulateBrokerFailures ?? false,
      enableDeadLetterQueue: config.enableDeadLetterQueue ?? true,
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
      initialRetryDelayMs: config.initialRetryDelayMs ?? 100,
      retryBackoffFactor: config.retryBackoffFactor ?? 2,
      trackMessageOrdering: config.trackMessageOrdering ?? true,
      validateMessageSchemas: config.validateMessageSchemas ?? false,
    };

    this.producer = new MockKafkaProducer(this);
  }

  /**
   * Connects the test client
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.log('Connecting test Kafka client...');
    this.connected = true;
    this.log('Test Kafka client connected');
  }

  /**
   * Disconnects the test client
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.log('Disconnecting test Kafka client...');
    this.connected = false;
    this.messageSubjects.clear();
    this.topicPartitions.clear();
    this.injectedErrors = [];
    this.log('Test Kafka client disconnected');
  }

  /**
   * Gets the producer instance
   * @returns The mock Kafka producer
   */
  getProducer(): IKafkaProducer {
    return this.producer;
  }

  /**
   * Gets a consumer instance
   * @param groupId Consumer group ID
   * @returns The mock Kafka consumer
   */
  getConsumer(groupId = 'test-group'): IKafkaConsumer {
    if (!this.consumers.has(groupId)) {
      this.consumers.set(groupId, new MockKafkaConsumer(this, groupId));
    }
    return this.consumers.get(groupId)!;
  }

  /**
   * Gets the dead letter queue implementation
   * @returns The mock Kafka dead letter queue
   */
  getDeadLetterQueue(): IKafkaDeadLetterQueue {
    return new MockKafkaDeadLetterQueue(this);
  }

  /**
   * Checks if the client is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets the current configuration
   * @returns The current configuration
   */
  getConfig(): IKafkaConfig {
    return {
      brokers: ['localhost:9092'],
      clientId: 'test-client',
      groupId: 'test-group',
    };
  }

  /**
   * Creates a topic with the specified number of partitions
   * @param topic Topic name
   * @param numPartitions Number of partitions
   */
  createTopic(topic: string, numPartitions = 1): void {
    if (!this.topicPartitions.has(topic)) {
      this.topicPartitions.set(topic, Array.from({ length: numPartitions }, (_, i) => i));
      this.messageSubjects.set(topic, new Subject<IKafkaMessage>());
      this.log(`Created topic ${topic} with ${numPartitions} partition(s)`);
    }
  }

  /**
   * Deletes a topic
   * @param topic Topic name
   */
  deleteTopic(topic: string): void {
    this.topicPartitions.delete(topic);
    const subject = this.messageSubjects.get(topic);
    if (subject) {
      subject.complete();
      this.messageSubjects.delete(topic);
    }
    this.log(`Deleted topic ${topic}`);
  }

  /**
   * Gets the number of partitions for a topic
   * @param topic Topic name
   * @returns Number of partitions
   */
  getPartitionCount(topic: string): number {
    return this.topicPartitions.get(topic)?.length ?? 0;
  }

  /**
   * Gets the message subject for a topic
   * @param topic Topic name
   * @returns Subject for the topic
   */
  getMessageSubject(topic: string): Subject<IKafkaMessage> {
    if (!this.messageSubjects.has(topic)) {
      this.createTopic(topic);
    }
    return this.messageSubjects.get(topic)!;
  }

  /**
   * Publishes a message to a topic
   * @param message Message to publish
   * @param options Delivery options
   * @returns Promise that resolves with the message metadata
   */
  async publishMessage<T = any>(
    message: IKafkaMessage<T>,
    options: MessageDeliveryOptions = {}
  ): Promise<IKafkaProducerRecord> {
    if (!this.connected) {
      throw new Error('Client is not connected');
    }

    // Ensure the topic exists
    const topic = message.topic || '';
    if (!topic) {
      throw new Error('Message must have a topic');
    }

    if (!this.topicPartitions.has(topic)) {
      this.createTopic(topic);
    }

    // Check for injected errors
    const matchingError = this.injectedErrors.find(
      (e) =>
        e.topic === topic &&
        (e.partition === undefined || e.partition === (message.partition ?? 0)) &&
        (e.count === undefined || e.count > 0)
    );

    if (matchingError) {
      // Update the error count if specified
      if (matchingError.count !== undefined) {
        matchingError.count--;
      }

      // Clear the error if configured to do so
      if (matchingError.clearAfterTrigger && (matchingError.count === undefined || matchingError.count <= 0)) {
        this.injectedErrors = this.injectedErrors.filter((e) => e !== matchingError);
      }

      throw matchingError.error;
    }

    // Simulate network errors if configured
    if (this.config.simulateNetworkErrors && Math.random() < this.config.networkErrorProbability) {
      throw new Error('Simulated network error');
    }

    // Determine the partition
    const partitionCount = this.getPartitionCount(topic);
    const partition = options.partition !== undefined ? options.partition : this.getPartitionForMessage(message, partitionCount);

    // Create a copy of the message with the partition set
    const messageWithPartition: IKafkaMessage<T> = {
      ...message,
      topic,
      partition,
      offset: String(this.getNextOffset(topic, partition)),
      timestamp: message.timestamp || new Date().toISOString(),
    };

    // Create an audit record
    const auditRecord: MessageAuditRecord<T> = {
      id: uuidv4(),
      topic,
      partition,
      key: messageWithPartition.key as string | Buffer | undefined,
      headers: messageWithPartition.headers,
      value: messageWithPartition.value as T,
      producedAt: new Date().toISOString(),
      deliveryAttempts: 1,
      delivered: false,
      sentToDLQ: false,
    };

    // Handle simulated errors
    if (options.simulateError) {
      const error = options.errorToThrow || new Error('Simulated delivery error');
      auditRecord.error = error;
      auditRecord.deliveryAttempts++;

      // Send to DLQ if enabled and max retries exceeded
      if (this.config.enableDeadLetterQueue && auditRecord.deliveryAttempts > this.config.maxRetryAttempts) {
        this.sendToDLQ(messageWithPartition, error, this.config.maxRetryAttempts);
        auditRecord.sentToDLQ = true;
      }

      this.messageAudit.push(auditRecord);
      throw error;
    }

    // Deliver the message after the specified delay
    const delayMs = options.delayMs ?? this.config.defaultDeliveryDelayMs;
    setTimeout(() => {
      const subject = this.getMessageSubject(topic);
      subject.next(messageWithPartition);
      auditRecord.delivered = true;
      this.log(`Delivered message to ${topic}[${partition}]: ${JSON.stringify(messageWithPartition.value)}`);
    }, delayMs);

    this.messageAudit.push(auditRecord);

    // Return the producer record
    return {
      topic,
      partition,
      offset: messageWithPartition.offset,
      timestamp: messageWithPartition.timestamp,
    };
  }

  /**
   * Publishes a batch of messages to topics
   * @param messages Messages to publish
   * @param options Delivery options
   * @returns Promise that resolves with the batch metadata
   */
  async publishBatch<T = any>(
    messages: IKafkaMessage<T>[],
    options: MessageDeliveryOptions = {}
  ): Promise<IKafkaProducerBatchRecord> {
    if (!this.connected) {
      throw new Error('Client is not connected');
    }

    const records: IKafkaProducerRecord[] = [];

    try {
      for (const message of messages) {
        const record = await this.publishMessage(message, options);
        records.push(record);
      }

      return { records };
    } catch (error) {
      return { records, error: error as Error };
    }
  }

  /**
   * Injects an error for a specific topic/partition
   * @param options Error injection options
   */
  injectError(options: ErrorInjectionOptions): void {
    this.injectedErrors.push({
      ...options,
      clearAfterTrigger: options.clearAfterTrigger ?? true,
      count: options.count ?? 1,
    });
    this.log(`Injected error for ${options.topic}[${options.partition ?? 'all'}]: ${options.error.message}`);
  }

  /**
   * Clears all injected errors
   */
  clearInjectedErrors(): void {
    this.injectedErrors = [];
    this.log('Cleared all injected errors');
  }

  /**
   * Gets the message audit log
   * @returns Array of message audit records
   */
  getMessageAudit(): MessageAuditRecord[] {
    return [...this.messageAudit];
  }

  /**
   * Clears the message audit log
   */
  clearMessageAudit(): void {
    this.messageAudit = [];
    this.log('Cleared message audit log');
  }

  /**
   * Gets messages from the dead letter queue for a topic
   * @param topic Topic name
   * @returns Array of dead letter queue records
   */
  getDLQMessages(topic: string): DeadLetterQueueRecord[] {
    return this.deadLetterQueue.get(topic) || [];
  }

  /**
   * Gets all messages from the dead letter queue
   * @returns Map of topic to dead letter queue records
   */
  getAllDLQMessages(): Map<string, DeadLetterQueueRecord[]> {
    return new Map(this.deadLetterQueue);
  }

  /**
   * Clears the dead letter queue for a topic
   * @param topic Topic name
   */
  clearDLQ(topic: string): void {
    this.deadLetterQueue.delete(topic);
    this.log(`Cleared DLQ for topic ${topic}`);
  }

  /**
   * Clears all dead letter queues
   */
  clearAllDLQs(): void {
    this.deadLetterQueue.clear();
    this.log('Cleared all DLQs');
  }

  /**
   * Sends a message to the dead letter queue
   * @param message Message to send to DLQ
   * @param error Error that caused the message to be sent to DLQ
   * @param retryCount Number of retry attempts made
   */
  sendToDLQ<T = any>(message: IKafkaMessage<T>, error: Error, retryCount: number): void {
    if (!this.config.enableDeadLetterQueue) {
      return;
    }

    const topic = message.topic || '';
    if (!topic) {
      return;
    }

    const dlqRecord: DeadLetterQueueRecord<T> = {
      originalMessage: message,
      error,
      retryCount,
      timestamp: new Date().toISOString(),
      originalTopic: topic,
      originalPartition: message.partition ?? 0,
    };

    if (!this.deadLetterQueue.has(topic)) {
      this.deadLetterQueue.set(topic, []);
    }

    this.deadLetterQueue.get(topic)!.push(dlqRecord);
    this.log(`Sent message to DLQ for ${topic}[${message.partition ?? 0}]: ${error.message}`);
  }

  /**
   * Reprocesses a message from the dead letter queue
   * @param topic Topic name
   * @param index Index of the message in the DLQ
   * @returns Promise that resolves when the message is reprocessed
   */
  async reprocessDLQMessage(topic: string, index: number): Promise<IKafkaProducerRecord | null> {
    const dlqMessages = this.deadLetterQueue.get(topic);
    if (!dlqMessages || !dlqMessages[index]) {
      return null;
    }

    const dlqRecord = dlqMessages[index];
    const { originalMessage, originalTopic } = dlqRecord;

    // Remove the message from the DLQ
    dlqMessages.splice(index, 1);
    if (dlqMessages.length === 0) {
      this.deadLetterQueue.delete(topic);
    }

    // Republish the message
    this.log(`Reprocessing message from DLQ for ${originalTopic}`);
    return this.publishMessage(originalMessage);
  }

  /**
   * Reprocesses all messages in the dead letter queue for a topic
   * @param topic Topic name
   * @returns Promise that resolves when all messages are reprocessed
   */
  async reprocessAllDLQMessages(topic: string): Promise<IKafkaProducerRecord[]> {
    const dlqMessages = this.deadLetterQueue.get(topic);
    if (!dlqMessages || dlqMessages.length === 0) {
      return [];
    }

    const results: IKafkaProducerRecord[] = [];
    const messagesToReprocess = [...dlqMessages];
    this.deadLetterQueue.delete(topic);

    for (const dlqRecord of messagesToReprocess) {
      const { originalMessage } = dlqRecord;
      try {
        const result = await this.publishMessage(originalMessage);
        results.push(result);
      } catch (error) {
        this.log(`Error reprocessing message from DLQ: ${(error as Error).message}`);
      }
    }

    return results;
  }

  /**
   * Gets the next offset for a topic/partition
   * @param topic Topic name
   * @param partition Partition number
   * @returns Next offset
   */
  private getNextOffset(topic: string, partition: number): number {
    // Count existing messages for this topic/partition in the audit log
    return this.messageAudit.filter((record) => record.topic === topic && record.partition === partition).length;
  }

  /**
   * Gets the partition for a message
   * @param message Message to get partition for
   * @param partitionCount Number of partitions
   * @returns Partition number
   */
  private getPartitionForMessage<T = any>(message: IKafkaMessage<T>, partitionCount: number): number {
    if (partitionCount <= 1) {
      return 0;
    }

    if (message.partition !== undefined && message.partition < partitionCount) {
      return message.partition;
    }

    if (message.key) {
      // Use the key to determine the partition (consistent hashing)
      const keyStr = message.key.toString();
      let hash = 0;
      for (let i = 0; i < keyStr.length; i++) {
        hash = (hash * 31 + keyStr.charCodeAt(i)) % partitionCount;
      }
      return Math.abs(hash % partitionCount);
    }

    // No key, use round-robin
    return Math.floor(Math.random() * partitionCount);
  }

  /**
   * Logs a message if logging is enabled
   * @param message Message to log
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[KafkaTestClient] ${message}`);
    }
  }
}

/**
 * Mock implementation of the Kafka producer interface
 */
class MockKafkaProducer implements IKafkaProducer {
  private client: KafkaTestClient;
  private connected = false;

  /**
   * Creates a new MockKafkaProducer instance
   * @param client The test client instance
   */
  constructor(client: KafkaTestClient) {
    this.client = client;
  }

  /**
   * Connects the producer
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await this.client.connect();
    this.connected = true;
  }

  /**
   * Disconnects the producer
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.connected = false;
  }

  /**
   * Sends a message to a Kafka topic
   * @param message The message to send
   * @returns Promise that resolves with the message metadata
   */
  async send<T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord> {
    if (!this.connected) {
      throw new Error('Producer is not connected');
    }

    return this.client.publishMessage(message);
  }

  /**
   * Sends a batch of messages to Kafka topics
   * @param messages Array of messages to send
   * @returns Promise that resolves with the batch metadata
   */
  async sendBatch<T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord> {
    if (!this.connected) {
      throw new Error('Producer is not connected');
    }

    return this.client.publishBatch(messages);
  }

  /**
   * Sends an event to a Kafka topic
   * @param topic The topic to send to
   * @param event The event to send
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Promise that resolves with the message metadata
   */
  async sendEvent(
    topic: string,
    event: BaseEvent,
    key?: string,
    headers?: IKafkaHeaders
  ): Promise<IKafkaProducerRecord> {
    if (!this.connected) {
      throw new Error('Producer is not connected');
    }

    const message: IKafkaMessage<BaseEvent> = {
      topic,
      key: key || event.eventId,
      value: event,
      headers,
    };

    return this.client.publishMessage(message);
  }

  /**
   * Begins a transaction
   * @returns Promise that resolves with a transaction object
   */
  async transaction(): Promise<IKafkaTransaction> {
    if (!this.connected) {
      throw new Error('Producer is not connected');
    }

    return new MockKafkaTransaction(this.client);
  }

  /**
   * Checks if the producer is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Mock implementation of the Kafka transaction interface
 */
class MockKafkaTransaction implements IKafkaTransaction {
  private client: KafkaTestClient;
  private messages: IKafkaMessage[] = [];
  private committed = false;
  private aborted = false;

  /**
   * Creates a new MockKafkaTransaction instance
   * @param client The test client instance
   */
  constructor(client: KafkaTestClient) {
    this.client = client;
  }

  /**
   * Sends a message within this transaction
   * @param message The message to send
   * @returns Promise that resolves with the message metadata
   */
  async send<T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord> {
    if (this.committed || this.aborted) {
      throw new Error('Transaction already committed or aborted');
    }

    this.messages.push(message);
    return {
      topic: message.topic || '',
      partition: message.partition || 0,
      offset: '0',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sends a batch of messages within this transaction
   * @param messages Array of messages to send
   * @returns Promise that resolves with the batch metadata
   */
  async sendBatch<T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord> {
    if (this.committed || this.aborted) {
      throw new Error('Transaction already committed or aborted');
    }

    const records: IKafkaProducerRecord[] = [];

    for (const message of messages) {
      this.messages.push(message);
      records.push({
        topic: message.topic || '',
        partition: message.partition || 0,
        offset: '0',
        timestamp: new Date().toISOString(),
      });
    }

    return { records };
  }

  /**
   * Commits the transaction
   * @returns Promise that resolves when the transaction is committed
   */
  async commit(): Promise<void> {
    if (this.committed || this.aborted) {
      throw new Error('Transaction already committed or aborted');
    }

    this.committed = true;

    // Publish all messages in the transaction
    for (const message of this.messages) {
      await this.client.publishMessage(message);
    }
  }

  /**
   * Aborts the transaction
   * @returns Promise that resolves when the transaction is aborted
   */
  async abort(): Promise<void> {
    if (this.committed || this.aborted) {
      throw new Error('Transaction already committed or aborted');
    }

    this.aborted = true;
    this.messages = [];
  }
}

/**
 * Mock implementation of the Kafka consumer interface
 */
class MockKafkaConsumer implements IKafkaConsumer {
  private client: KafkaTestClient;
  private groupId: string;
  private connected = false;
  private subscriptions: string[] = [];
  private messageObservables: Map<string, Observable<IKafkaMessage>> = new Map();
  private paused: IKafkaTopicPartition[] = [];

  /**
   * Creates a new MockKafkaConsumer instance
   * @param client The test client instance
   * @param groupId Consumer group ID
   */
  constructor(client: KafkaTestClient, groupId: string) {
    this.client = client;
    this.groupId = groupId;
  }

  /**
   * Connects the consumer
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await this.client.connect();
    this.connected = true;
  }

  /**
   * Disconnects the consumer
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.connected = false;
    this.subscriptions = [];
    this.messageObservables.clear();
    this.paused = [];
  }

  /**
   * Subscribes to Kafka topics
   * @param topics Array of topics to subscribe to
   * @returns Promise that resolves when subscribed
   */
  async subscribe(topics: string[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer is not connected');
    }

    // Create any topics that don't exist
    for (const topic of topics) {
      if (!this.client.getPartitionCount(topic)) {
        this.client.createTopic(topic);
      }
    }

    this.subscriptions = [...new Set([...this.subscriptions, ...topics])];

    // Create observables for each topic
    for (const topic of this.subscriptions) {
      if (!this.messageObservables.has(topic)) {
        const subject = this.client.getMessageSubject(topic);
        this.messageObservables.set(
          topic,
          subject.asObservable().pipe(
            // Filter out messages for paused topic-partitions
            filter((message) => {
              const partition = message.partition ?? 0;
              return !this.paused.some((tp) => tp.topic === topic && tp.partition === partition);
            })
          )
        );
      }
    }
  }

  /**
   * Consumes messages from subscribed topics
   * @param options Consumption options
   * @returns Observable that emits consumed messages
   */
  consume<T = any>(options?: IKafkaConsumerOptions): Observable<IKafkaMessage<T>> {
    if (!this.connected) {
      throw new Error('Consumer is not connected');
    }

    if (this.subscriptions.length === 0) {
      throw new Error('No topics subscribed');
    }

    // Merge all topic observables
    const observables = this.subscriptions.map((topic) => this.messageObservables.get(topic)!);
    return new Observable<IKafkaMessage<T>>((subscriber) => {
      const subscription = Observable.merge(...observables)
        .pipe(
          // Add a small delay to simulate processing time
          delay(10),
          // Update the audit log when a message is consumed
          tap((message) => {
            const auditRecords = this.client.getMessageAudit();
            const matchingRecord = auditRecords.find(
              (record) =>
                record.topic === message.topic &&
                record.partition === (message.partition ?? 0) &&
                record.offset === message.offset
            );

            if (matchingRecord) {
              matchingRecord.consumedAt = new Date().toISOString();
            }
          })
        )
        .subscribe({
          next: (message) => subscriber.next(message as IKafkaMessage<T>),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Commits consumed message offsets
   * @param message The message to commit
   * @returns Promise that resolves when offsets are committed
   */
  async commit(message: IKafkaMessage): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer is not connected');
    }

    // In the test client, this is a no-op as we don't track offsets
    return Promise.resolve();
  }

  /**
   * Seeks to a specific offset in a partition
   * @param topic The topic to seek in
   * @param partition The partition to seek in
   * @param offset The offset to seek to
   * @returns Promise that resolves when the seek is complete
   */
  async seek(topic: string, partition: number, offset: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer is not connected');
    }

    // In the test client, this is a no-op as we don't track offsets
    return Promise.resolve();
  }

  /**
   * Pauses consumption from specific topics/partitions
   * @param topicPartitions Array of topic-partitions to pause
   * @returns Promise that resolves when consumption is paused
   */
  async pause(topicPartitions: IKafkaTopicPartition[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer is not connected');
    }

    // Add to paused list, avoiding duplicates
    for (const tp of topicPartitions) {
      if (!this.paused.some((p) => p.topic === tp.topic && p.partition === tp.partition)) {
        this.paused.push(tp);
      }
    }

    return Promise.resolve();
  }

  /**
   * Resumes consumption from specific topics/partitions
   * @param topicPartitions Array of topic-partitions to resume
   * @returns Promise that resolves when consumption is resumed
   */
  async resume(topicPartitions: IKafkaTopicPartition[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer is not connected');
    }

    // Remove from paused list
    this.paused = this.paused.filter(
      (p) => !topicPartitions.some((tp) => tp.topic === p.topic && tp.partition === p.partition)
    );

    return Promise.resolve();
  }

  /**
   * Checks if the consumer is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Mock implementation of the Kafka dead letter queue interface
 */
class MockKafkaDeadLetterQueue implements IKafkaDeadLetterQueue {
  private client: KafkaTestClient;

  /**
   * Creates a new MockKafkaDeadLetterQueue instance
   * @param client The test client instance
   */
  constructor(client: KafkaTestClient) {
    this.client = client;
  }

  /**
   * Sends a message to the dead letter queue
   * @param message The failed message
   * @param error The error that caused the failure
   * @param retryCount Number of retry attempts made
   * @returns Promise that resolves when the message is sent to DLQ
   */
  async sendToDLQ<T = any>(message: IKafkaMessage<T>, error: Error, retryCount: number): Promise<void> {
    this.client.sendToDLQ(message, error, retryCount);
    return Promise.resolve();
  }

  /**
   * Retrieves messages from the dead letter queue
   * @param topic The original topic
   * @param limit Maximum number of messages to retrieve
   * @returns Promise that resolves with the retrieved messages
   */
  async retrieveFromDLQ<T = any>(topic: string, limit?: number): Promise<IKafkaMessage<T>[]> {
    const dlqMessages = this.client.getDLQMessages(topic);
    const messages = dlqMessages.map((record) => record.originalMessage as IKafkaMessage<T>);
    return limit ? messages.slice(0, limit) : messages;
  }

  /**
   * Retries processing a message from the dead letter queue
   * @param message The message to retry
   * @returns Promise that resolves when the message is reprocessed
   */
  async retryMessage<T = any>(message: IKafkaMessage<T>): Promise<void> {
    const topic = message.topic || '';
    if (!topic) {
      throw new Error('Message must have a topic');
    }

    const dlqMessages = this.client.getDLQMessages(topic);
    const index = dlqMessages.findIndex((record) => {
      const originalMessage = record.originalMessage;
      return (
        originalMessage.topic === message.topic &&
        originalMessage.partition === message.partition &&
        originalMessage.offset === message.offset
      );
    });

    if (index === -1) {
      throw new Error('Message not found in DLQ');
    }

    await this.client.reprocessDLQMessage(topic, index);
    return Promise.resolve();
  }

  /**
   * Retries all messages in the dead letter queue for a topic
   * @param topic The original topic
   * @returns Promise that resolves when all messages are reprocessed
   */
  async retryAllMessages(topic: string): Promise<void> {
    await this.client.reprocessAllDLQMessages(topic);
    return Promise.resolve();
  }
}

/**
 * Creates a new Kafka test client with default configuration
 * @returns A configured KafkaTestClient instance
 */
export function createKafkaTestClient(config?: KafkaTestClientConfig): KafkaTestClient {
  return new KafkaTestClient(config);
}

/**
 * Creates a test event for use in tests
 * @param type Event type
 * @param source Event source
 * @param payload Event payload
 * @param options Additional event options
 * @returns A BaseEvent instance
 */
export function createTestEvent<T = any>(
  type: string,
  source: string,
  payload: T,
  options?: {
    eventId?: string;
    timestamp?: string;
    version?: string;
    userId?: string;
    journey?: string;
    metadata?: Record<string, any>;
  }
): BaseEvent<T> {
  return {
    eventId: options?.eventId || uuidv4(),
    type,
    source,
    timestamp: options?.timestamp || new Date().toISOString(),
    version: options?.version || '1.0.0',
    userId: options?.userId,
    journey: options?.journey as any,
    payload,
    metadata: options?.metadata,
  };
}
/**
 * @file mock-kafka-producer.ts
 * @description Mock implementation of a Kafka producer for unit testing.
 * This file provides a test double for the KafkaJS Producer class, simulating
 * message production capabilities without requiring a real Kafka connection.
 * It tracks produced messages for verification in tests and supports testing error scenarios.
 */

import { EventEmitter } from 'events';
import { IKafkaHeaders, IKafkaMessage, IKafkaProducer, IKafkaProducerBatchRecord, IKafkaProducerRecord, IKafkaTransaction } from '../../../../../src/kafka/kafka.interfaces';
import { BaseEvent } from '../../../../../src/interfaces/base-event.interface';

/**
 * Configuration options for the MockKafkaProducer
 */
export interface MockKafkaProducerOptions {
  /**
   * Whether to simulate connection errors
   * @default false
   */
  simulateConnectionError?: boolean;

  /**
   * Whether to simulate send errors
   * @default false
   */
  simulateSendError?: boolean;

  /**
   * Whether to simulate transaction errors
   * @default false
   */
  simulateTransactionError?: boolean;

  /**
   * Delay in milliseconds to simulate network latency
   * @default 0
   */
  sendDelay?: number;

  /**
   * Custom error to throw when simulating errors
   */
  customError?: Error;
}

/**
 * Mock implementation of a Kafka producer for unit testing.
 * Implements the IKafkaProducer interface to provide a test double
 * that can be used in place of a real Kafka producer.
 */
export class MockKafkaProducer implements IKafkaProducer {
  /**
   * Event emitter for producer events
   * @private
   */
  private readonly eventEmitter: EventEmitter = new EventEmitter();

  /**
   * Whether the producer is connected
   * @private
   */
  private connected: boolean = false;

  /**
   * Array of sent messages for verification in tests
   * @private
   */
  private sentMessages: IKafkaMessage[] = [];

  /**
   * Array of sent batches for verification in tests
   * @private
   */
  private sentBatches: IKafkaMessage[][] = [];

  /**
   * Configuration options for the mock producer
   * @private
   */
  private options: MockKafkaProducerOptions;

  /**
   * Creates a new MockKafkaProducer instance
   * @param options Configuration options for the mock producer
   */
  constructor(options: MockKafkaProducerOptions = {}) {
    this.options = {
      simulateConnectionError: false,
      simulateSendError: false,
      simulateTransactionError: false,
      sendDelay: 0,
      ...options,
    };
  }

  /**
   * Simulates connecting to the Kafka broker
   * @returns Promise that resolves when connected or rejects if connection fails
   */
  async connect(): Promise<void> {
    if (this.options.simulateConnectionError) {
      const error = this.options.customError || new Error('Failed to connect to Kafka broker');
      this.eventEmitter.emit('error', error);
      throw error;
    }

    this.connected = true;
    this.eventEmitter.emit('connect');
    return Promise.resolve();
  }

  /**
   * Simulates disconnecting from the Kafka broker
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.eventEmitter.emit('disconnect');
    return Promise.resolve();
  }

  /**
   * Simulates sending a message to a Kafka topic
   * @param message The message to send
   * @returns Promise that resolves with the message metadata or rejects if send fails
   */
  async send<T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord> {
    if (!this.connected) {
      const error = new Error('Producer not connected');
      this.eventEmitter.emit('error', error);
      throw error;
    }

    if (this.options.simulateSendError) {
      const error = this.options.customError || new Error('Failed to send message to Kafka topic');
      this.eventEmitter.emit('error', error);
      throw error;
    }

    // Clone the message to avoid reference issues
    const messageCopy = JSON.parse(JSON.stringify(message));
    this.sentMessages.push(messageCopy);
    this.eventEmitter.emit('message', messageCopy);

    // Simulate network latency
    if (this.options.sendDelay && this.options.sendDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.sendDelay));
    }

    return {
      topic: message.topic,
      partition: message.partition || 0,
      offset: String(this.sentMessages.length - 1),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Simulates sending a batch of messages to Kafka topics
   * @param messages Array of messages to send
   * @returns Promise that resolves with the batch metadata or rejects if send fails
   */
  async sendBatch<T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord> {
    if (!this.connected) {
      const error = new Error('Producer not connected');
      this.eventEmitter.emit('error', error);
      throw error;
    }

    if (this.options.simulateSendError) {
      const error = this.options.customError || new Error('Failed to send batch to Kafka topics');
      this.eventEmitter.emit('error', error);
      throw error;
    }

    // Clone the messages to avoid reference issues
    const messagesCopy = JSON.parse(JSON.stringify(messages));
    this.sentBatches.push(messagesCopy);
    this.sentMessages.push(...messagesCopy);
    this.eventEmitter.emit('batch', messagesCopy);

    // Simulate network latency
    if (this.options.sendDelay && this.options.sendDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.sendDelay));
    }

    const records: IKafkaProducerRecord[] = messages.map((message, index) => ({
      topic: message.topic,
      partition: message.partition || 0,
      offset: String(this.sentMessages.length - messages.length + index),
      timestamp: new Date().toISOString(),
    }));

    return {
      records,
    };
  }

  /**
   * Simulates sending an event to a Kafka topic
   * @param topic The topic to send to
   * @param event The event to send
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Promise that resolves with the message metadata or rejects if send fails
   */
  async sendEvent(topic: string, event: BaseEvent, key?: string, headers?: IKafkaHeaders): Promise<IKafkaProducerRecord> {
    const message: IKafkaMessage<BaseEvent> = {
      topic,
      value: event,
      key: key ? Buffer.from(key) : undefined,
      headers,
    };

    return this.send(message);
  }

  /**
   * Simulates beginning a transaction
   * @returns Promise that resolves with a transaction object or rejects if transaction fails
   */
  async transaction(): Promise<IKafkaTransaction> {
    if (!this.connected) {
      const error = new Error('Producer not connected');
      this.eventEmitter.emit('error', error);
      throw error;
    }

    if (this.options.simulateTransactionError) {
      const error = this.options.customError || new Error('Failed to create transaction');
      this.eventEmitter.emit('error', error);
      throw error;
    }

    const transactionId = `mock-transaction-${Date.now()}`;
    const transactionMessages: IKafkaMessage[] = [];
    const transactionBatches: IKafkaMessage[][] = [];
    let transactionAborted = false;
    let transactionCommitted = false;

    this.eventEmitter.emit('transaction.start', transactionId);

    return {
      send: async <T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord> => {
        if (transactionAborted) {
          const error = new Error('Transaction was aborted');
          this.eventEmitter.emit('transaction.error', error, transactionId);
          throw error;
        }

        if (transactionCommitted) {
          const error = new Error('Transaction was already committed');
          this.eventEmitter.emit('transaction.error', error, transactionId);
          throw error;
        }

        // Clone the message to avoid reference issues
        const messageCopy = JSON.parse(JSON.stringify(message));
        transactionMessages.push(messageCopy);
        this.eventEmitter.emit('transaction.message', messageCopy, transactionId);

        // Simulate network latency
        if (this.options.sendDelay && this.options.sendDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.sendDelay));
        }

        return {
          topic: message.topic,
          partition: message.partition || 0,
          offset: String(transactionMessages.length - 1),
          timestamp: new Date().toISOString(),
        };
      },

      sendBatch: async <T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord> => {
        if (transactionAborted) {
          const error = new Error('Transaction was aborted');
          this.eventEmitter.emit('transaction.error', error, transactionId);
          throw error;
        }

        if (transactionCommitted) {
          const error = new Error('Transaction was already committed');
          this.eventEmitter.emit('transaction.error', error, transactionId);
          throw error;
        }

        // Clone the messages to avoid reference issues
        const messagesCopy = JSON.parse(JSON.stringify(messages));
        transactionBatches.push(messagesCopy);
        transactionMessages.push(...messagesCopy);
        this.eventEmitter.emit('transaction.batch', messagesCopy, transactionId);

        // Simulate network latency
        if (this.options.sendDelay && this.options.sendDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.sendDelay));
        }

        const records: IKafkaProducerRecord[] = messages.map((message, index) => ({
          topic: message.topic,
          partition: message.partition || 0,
          offset: String(transactionMessages.length - messages.length + index),
          timestamp: new Date().toISOString(),
        }));

        return {
          records,
        };
      },

      commit: async (): Promise<void> => {
        if (transactionAborted) {
          const error = new Error('Transaction was aborted');
          this.eventEmitter.emit('transaction.error', error, transactionId);
          throw error;
        }

        if (transactionCommitted) {
          const error = new Error('Transaction was already committed');
          this.eventEmitter.emit('transaction.error', error, transactionId);
          throw error;
        }

        // Add transaction messages to the producer's sent messages
        this.sentMessages.push(...transactionMessages);
        this.sentBatches.push(...transactionBatches);

        transactionCommitted = true;
        this.eventEmitter.emit('transaction.commit', transactionId, transactionMessages.length);
        return Promise.resolve();
      },

      abort: async (): Promise<void> => {
        if (transactionCommitted) {
          const error = new Error('Transaction was already committed');
          this.eventEmitter.emit('transaction.error', error, transactionId);
          throw error;
        }

        if (transactionAborted) {
          const error = new Error('Transaction was already aborted');
          this.eventEmitter.emit('transaction.error', error, transactionId);
          throw error;
        }

        transactionAborted = true;
        this.eventEmitter.emit('transaction.abort', transactionId);
        return Promise.resolve();
      },
    };
  }

  /**
   * Checks if the producer is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets all messages sent by this producer
   * @returns Array of sent messages
   */
  getSentMessages<T = any>(): IKafkaMessage<T>[] {
    return this.sentMessages as IKafkaMessage<T>[];
  }

  /**
   * Gets all batches sent by this producer
   * @returns Array of sent batches
   */
  getSentBatches<T = any>(): IKafkaMessage<T>[][] {
    return this.sentBatches as IKafkaMessage<T>[][];
  }

  /**
   * Gets messages sent to a specific topic
   * @param topic The topic to filter by
   * @returns Array of messages sent to the specified topic
   */
  getMessagesByTopic<T = any>(topic: string): IKafkaMessage<T>[] {
    return this.sentMessages.filter(message => message.topic === topic) as IKafkaMessage<T>[];
  }

  /**
   * Clears all sent messages and batches
   */
  clearSentMessages(): void {
    this.sentMessages = [];
    this.sentBatches = [];
  }

  /**
   * Sets the connection state
   * @param connected The new connection state
   */
  setConnected(connected: boolean): void {
    this.connected = connected;
    this.eventEmitter.emit(connected ? 'connect' : 'disconnect');
  }

  /**
   * Updates the producer options
   * @param options New options to apply
   */
  setOptions(options: Partial<MockKafkaProducerOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Registers an event listener
   * @param event The event to listen for
   * @param listener The listener function
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Removes an event listener
   * @param event The event to stop listening for
   * @param listener The listener function to remove
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Registers a one-time event listener
   * @param event The event to listen for once
   * @param listener The listener function
   */
  once(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.once(event, listener);
  }

  /**
   * Emits an event
   * @param event The event to emit
   * @param args Arguments to pass to the listeners
   */
  emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }

  /**
   * Verifies that a specific message was sent
   * @param predicate Function that returns true if the message matches the criteria
   * @returns True if a matching message was found, false otherwise
   */
  verifyMessageSent<T = any>(predicate: (message: IKafkaMessage<T>) => boolean): boolean {
    return this.sentMessages.some(message => predicate(message as IKafkaMessage<T>));
  }

  /**
   * Verifies that a specific event was sent
   * @param eventType The type of event to look for
   * @param predicate Optional function for additional criteria
   * @returns True if a matching event was found, false otherwise
   */
  verifyEventSent(eventType: string, predicate?: (event: BaseEvent) => boolean): boolean {
    return this.sentMessages.some(message => {
      const event = message.value as BaseEvent;
      return event.type === eventType && (!predicate || predicate(event));
    });
  }

  /**
   * Counts the number of messages sent to a specific topic
   * @param topic The topic to count messages for
   * @returns The number of messages sent to the specified topic
   */
  countMessagesByTopic(topic: string): number {
    return this.getMessagesByTopic(topic).length;
  }

  /**
   * Counts the total number of messages sent
   * @returns The total number of messages sent
   */
  countTotalMessages(): number {
    return this.sentMessages.length;
  }
}

/**
 * Creates a new MockKafkaProducer instance with default options
 * @returns A new MockKafkaProducer instance
 */
export function createMockKafkaProducer(options?: MockKafkaProducerOptions): MockKafkaProducer {
  return new MockKafkaProducer(options);
}
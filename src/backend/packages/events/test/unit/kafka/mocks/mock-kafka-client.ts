/**
 * @file mock-kafka-client.ts
 * @description Mock implementation of the KafkaJS client for unit testing.
 * This mock simulates the behavior of a real Kafka client without requiring an actual Kafka connection,
 * allowing tests to run in isolation.
 */

import { Admin, Consumer, Kafka, Producer } from 'kafkajs';
import { EventEmitter } from 'events';

/**
 * Interface for configuring the mock Kafka client behavior
 */
export interface MockKafkaClientConfig {
  /**
   * Whether connect operations should succeed
   * @default true
   */
  shouldConnectSucceed?: boolean;

  /**
   * Whether disconnect operations should succeed
   * @default true
   */
  shouldDisconnectSucceed?: boolean;

  /**
   * Whether producer send operations should succeed
   * @default true
   */
  shouldProducerSendSucceed?: boolean;

  /**
   * Whether consumer subscribe operations should succeed
   * @default true
   */
  shouldConsumerSubscribeSucceed?: boolean;

  /**
   * Whether consumer run operations should succeed
   * @default true
   */
  shouldConsumerRunSucceed?: boolean;

  /**
   * Whether admin operations should succeed
   * @default true
   */
  shouldAdminOperationsSucceed?: boolean;

  /**
   * Delay in milliseconds before operations complete
   * @default 0
   */
  operationDelay?: number;

  /**
   * Error to throw when operations fail
   * @default new Error('Mock operation failed')
   */
  errorToThrow?: Error;
}

/**
 * Mock implementation of the KafkaJS client for unit testing
 */
export class MockKafkaClient extends EventEmitter implements Kafka {
  /**
   * The client ID
   */
  private readonly clientId: string;

  /**
   * The broker list
   */
  private readonly brokers: string[];

  /**
   * Configuration for the mock behavior
   */
  private config: MockKafkaClientConfig;

  /**
   * Whether the client is connected
   */
  private connected = false;

  /**
   * Track calls to methods for assertions
   */
  public readonly calls: {
    connect: number;
    disconnect: number;
    producer: number;
    consumer: number;
    admin: number;
  } = {
    connect: 0,
    disconnect: 0,
    producer: 0,
    consumer: 0,
    admin: 0,
  };

  /**
   * Creates a new MockKafkaClient instance
   * 
   * @param options - The client options
   * @param mockConfig - Configuration for the mock behavior
   */
  constructor(
    options: { clientId: string; brokers: string[] },
    mockConfig: MockKafkaClientConfig = {}
  ) {
    super();
    this.clientId = options.clientId;
    this.brokers = options.brokers;
    this.config = {
      shouldConnectSucceed: true,
      shouldDisconnectSucceed: true,
      shouldProducerSendSucceed: true,
      shouldConsumerSubscribeSucceed: true,
      shouldConsumerRunSucceed: true,
      shouldAdminOperationsSucceed: true,
      operationDelay: 0,
      errorToThrow: new Error('Mock operation failed'),
      ...mockConfig,
    };
  }

  /**
   * Updates the mock configuration
   * 
   * @param config - New configuration options
   */
  public updateMockConfig(config: Partial<MockKafkaClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Creates a producer instance
   * 
   * @param options - Producer options
   * @returns A mock producer instance
   */
  public producer(options: any = {}): Producer {
    this.calls.producer++;
    return new MockProducer(this, options, this.config);
  }

  /**
   * Creates a consumer instance
   * 
   * @param options - Consumer options
   * @returns A mock consumer instance
   */
  public consumer(options: { groupId: string }): Consumer {
    this.calls.consumer++;
    return new MockConsumer(this, options, this.config);
  }

  /**
   * Creates an admin client instance
   * 
   * @param options - Admin client options
   * @returns A mock admin client instance
   */
  public admin(options: any = {}): Admin {
    this.calls.admin++;
    return new MockAdmin(this, options, this.config);
  }

  /**
   * Connects the client to the Kafka broker
   * 
   * @returns A promise that resolves when connected
   */
  public async connect(): Promise<void> {
    this.calls.connect++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldConnectSucceed) {
      throw this.config.errorToThrow;
    }

    this.connected = true;
    this.emit('connect');
  }

  /**
   * Disconnects the client from the Kafka broker
   * 
   * @returns A promise that resolves when disconnected
   */
  public async disconnect(): Promise<void> {
    this.calls.disconnect++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldDisconnectSucceed) {
      throw this.config.errorToThrow;
    }

    this.connected = false;
    this.emit('disconnect');
  }

  /**
   * Checks if the client is connected
   * 
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets the client ID
   * 
   * @returns The client ID
   */
  public getClientId(): string {
    return this.clientId;
  }

  /**
   * Gets the broker list
   * 
   * @returns The broker list
   */
  public getBrokers(): string[] {
    return [...this.brokers];
  }

  /**
   * Gets the logger instance (not implemented in mock)
   */
  public logger(): any {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setLogLevel: jest.fn(),
    };
  }
}

/**
 * Mock implementation of the KafkaJS Producer
 */
export class MockProducer extends EventEmitter implements Producer {
  /**
   * The parent Kafka client
   */
  private readonly client: MockKafkaClient;

  /**
   * The producer options
   */
  private readonly options: any;

  /**
   * Configuration for the mock behavior
   */
  private config: MockKafkaClientConfig;

  /**
   * Whether the producer is connected
   */
  private connected = false;

  /**
   * Track calls to methods for assertions
   */
  public readonly calls: {
    connect: number;
    disconnect: number;
    send: number;
    sendBatch: number;
    transaction: number;
  } = {
    connect: 0,
    disconnect: 0,
    send: 0,
    sendBatch: 0,
    transaction: 0,
  };

  /**
   * Messages sent by this producer
   */
  public readonly sentMessages: Array<{
    topic: string;
    messages: any[];
    partition?: number;
    acks?: number;
    timeout?: number;
    compression?: any;
  }> = [];

  /**
   * Creates a new MockProducer instance
   * 
   * @param client - The parent Kafka client
   * @param options - Producer options
   * @param config - Configuration for the mock behavior
   */
  constructor(
    client: MockKafkaClient,
    options: any,
    config: MockKafkaClientConfig
  ) {
    super();
    this.client = client;
    this.options = options;
    this.config = config;
  }

  /**
   * Connects the producer to the Kafka broker
   * 
   * @returns A promise that resolves when connected
   */
  public async connect(): Promise<void> {
    this.calls.connect++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldConnectSucceed) {
      throw this.config.errorToThrow;
    }

    this.connected = true;
    this.emit('connect');
  }

  /**
   * Disconnects the producer from the Kafka broker
   * 
   * @returns A promise that resolves when disconnected
   */
  public async disconnect(): Promise<void> {
    this.calls.disconnect++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldDisconnectSucceed) {
      throw this.config.errorToThrow;
    }

    this.connected = false;
    this.emit('disconnect');
  }

  /**
   * Sends messages to a Kafka topic
   * 
   * @param record - The record to send
   * @returns A promise that resolves with the record metadata
   */
  public async send(record: {
    topic: string;
    messages: any[];
    partition?: number;
    acks?: number;
    timeout?: number;
    compression?: any;
  }): Promise<any> {
    this.calls.send++;
    this.sentMessages.push({ ...record });
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldProducerSendSucceed) {
      throw this.config.errorToThrow;
    }

    // Return mock record metadata
    return {
      topicName: record.topic,
      partition: record.partition || 0,
      errorCode: 0,
      baseOffset: '0',
      logAppendTime: '-1',
      logStartOffset: '0',
    };
  }

  /**
   * Sends a batch of messages to Kafka topics
   * 
   * @param records - The records to send
   * @returns A promise that resolves with the batch metadata
   */
  public async sendBatch(records: {
    topicMessages: Array<{
      topic: string;
      messages: any[];
    }>;
    acks?: number;
    timeout?: number;
    compression?: any;
  }): Promise<any> {
    this.calls.sendBatch++;
    
    for (const topicMessage of records.topicMessages) {
      this.sentMessages.push({
        topic: topicMessage.topic,
        messages: topicMessage.messages,
        acks: records.acks,
        timeout: records.timeout,
        compression: records.compression,
      });
    }
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldProducerSendSucceed) {
      throw this.config.errorToThrow;
    }

    // Return mock batch metadata
    return records.topicMessages.map(topicMessage => ({
      topicName: topicMessage.topic,
      partition: 0,
      errorCode: 0,
      baseOffset: '0',
      logAppendTime: '-1',
      logStartOffset: '0',
    }));
  }

  /**
   * Creates a transaction
   * 
   * @returns A promise that resolves with a transaction object
   */
  public async transaction(): Promise<any> {
    this.calls.transaction++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldProducerSendSucceed) {
      throw this.config.errorToThrow;
    }

    // Return mock transaction
    return {
      send: jest.fn().mockResolvedValue({}),
      sendBatch: jest.fn().mockResolvedValue([]),
      commit: jest.fn().mockResolvedValue(undefined),
      abort: jest.fn().mockResolvedValue(undefined),
      isActive: jest.fn().mockReturnValue(true),
    };
  }

  /**
   * Checks if the producer is connected
   * 
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets the logger instance (not implemented in mock)
   */
  public logger(): any {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setLogLevel: jest.fn(),
    };
  }

  /**
   * Gets the events instance (not implemented in mock)
   */
  public events(): any {
    return {};
  }
}

/**
 * Mock implementation of the KafkaJS Consumer
 */
export class MockConsumer extends EventEmitter implements Consumer {
  /**
   * The parent Kafka client
   */
  private readonly client: MockKafkaClient;

  /**
   * The consumer options
   */
  private readonly options: { groupId: string };

  /**
   * Configuration for the mock behavior
   */
  private config: MockKafkaClientConfig;

  /**
   * Whether the consumer is connected
   */
  private connected = false;

  /**
   * Whether the consumer is running
   */
  private running = false;

  /**
   * Topics the consumer is subscribed to
   */
  private subscribedTopics: string[] = [];

  /**
   * Track calls to methods for assertions
   */
  public readonly calls: {
    connect: number;
    disconnect: number;
    subscribe: number;
    run: number;
    stop: number;
    pause: number;
    resume: number;
    seek: number;
    describeGroup: number;
    commitOffsets: number;
  } = {
    connect: 0,
    disconnect: 0,
    subscribe: 0,
    run: 0,
    stop: 0,
    pause: 0,
    resume: 0,
    seek: 0,
    describeGroup: 0,
    commitOffsets: 0,
  };

  /**
   * Message handler function
   */
  private messageHandler: ((payload: any) => Promise<void>) | null = null;

  /**
   * Batch message handler function
   */
  private batchMessageHandler: ((payload: any) => Promise<void>) | null = null;

  /**
   * Creates a new MockConsumer instance
   * 
   * @param client - The parent Kafka client
   * @param options - Consumer options
   * @param config - Configuration for the mock behavior
   */
  constructor(
    client: MockKafkaClient,
    options: { groupId: string },
    config: MockKafkaClientConfig
  ) {
    super();
    this.client = client;
    this.options = options;
    this.config = config;
  }

  /**
   * Connects the consumer to the Kafka broker
   * 
   * @returns A promise that resolves when connected
   */
  public async connect(): Promise<void> {
    this.calls.connect++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldConnectSucceed) {
      throw this.config.errorToThrow;
    }

    this.connected = true;
    this.emit('connect');
  }

  /**
   * Disconnects the consumer from the Kafka broker
   * 
   * @returns A promise that resolves when disconnected
   */
  public async disconnect(): Promise<void> {
    this.calls.disconnect++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldDisconnectSucceed) {
      throw this.config.errorToThrow;
    }

    this.connected = false;
    this.running = false;
    this.emit('disconnect');
  }

  /**
   * Subscribes to Kafka topics
   * 
   * @param subscription - Subscription options
   * @returns A promise that resolves when subscribed
   */
  public async subscribe(subscription: {
    topic: string | RegExp;
    fromBeginning?: boolean;
  }): Promise<void> {
    this.calls.subscribe++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldConsumerSubscribeSucceed) {
      throw this.config.errorToThrow;
    }

    const topic = subscription.topic instanceof RegExp
      ? subscription.topic.source
      : subscription.topic;
    
    this.subscribedTopics.push(topic);
  }

  /**
   * Runs the consumer with the specified handler
   * 
   * @param options - Run options
   * @returns A promise that resolves when the consumer is running
   */
  public async run(options: {
    eachMessage?: (payload: any) => Promise<void>;
    eachBatch?: (payload: any) => Promise<void>;
  }): Promise<void> {
    this.calls.run++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldConsumerRunSucceed) {
      throw this.config.errorToThrow;
    }

    this.running = true;
    this.messageHandler = options.eachMessage || null;
    this.batchMessageHandler = options.eachBatch || null;
    this.emit('run');
  }

  /**
   * Stops the consumer
   * 
   * @returns A promise that resolves when the consumer is stopped
   */
  public async stop(): Promise<void> {
    this.calls.stop++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    this.running = false;
    this.emit('stop');
  }

  /**
   * Pauses consumption from specific topics/partitions
   * 
   * @param topicPartitions - Topics/partitions to pause
   * @returns A promise that resolves when consumption is paused
   */
  public async pause(topicPartitions: Array<{ topic: string; partitions?: number[] }>): Promise<void> {
    this.calls.pause++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    this.emit('pause', topicPartitions);
  }

  /**
   * Resumes consumption from specific topics/partitions
   * 
   * @param topicPartitions - Topics/partitions to resume
   * @returns A promise that resolves when consumption is resumed
   */
  public async resume(topicPartitions: Array<{ topic: string; partitions?: number[] }>): Promise<void> {
    this.calls.resume++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    this.emit('resume', topicPartitions);
  }

  /**
   * Seeks to a specific offset in a partition
   * 
   * @param topic - The topic to seek in
   * @param partition - The partition to seek in
   * @param offset - The offset to seek to
   * @returns A promise that resolves when the seek is complete
   */
  public async seek({
    topic,
    partition,
    offset,
  }: {
    topic: string;
    partition: number;
    offset: string;
  }): Promise<void> {
    this.calls.seek++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    this.emit('seek', { topic, partition, offset });
  }

  /**
   * Describes the consumer group
   * 
   * @returns A promise that resolves with the group description
   */
  public async describeGroup(): Promise<any> {
    this.calls.describeGroup++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    return {
      groupId: this.options.groupId,
      members: [],
    };
  }

  /**
   * Commits offsets for consumed messages
   * 
   * @param topicPartitions - Topics/partitions to commit
   * @returns A promise that resolves when offsets are committed
   */
  public async commitOffsets(topicPartitions: Array<{
    topic: string;
    partition: number;
    offset: string;
  }>): Promise<void> {
    this.calls.commitOffsets++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    this.emit('commitOffsets', topicPartitions);
  }

  /**
   * Checks if the consumer is connected
   * 
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Checks if the consumer is running
   * 
   * @returns True if running, false otherwise
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Gets the subscribed topics
   * 
   * @returns The subscribed topics
   */
  public getSubscribedTopics(): string[] {
    return [...this.subscribedTopics];
  }

  /**
   * Gets the consumer group ID
   * 
   * @returns The consumer group ID
   */
  public getGroupId(): string {
    return this.options.groupId;
  }

  /**
   * Simulates receiving a message
   * 
   * @param topic - The topic the message is from
   * @param partition - The partition the message is from
   * @param message - The message content
   * @returns A promise that resolves when the message is processed
   */
  public async simulateMessageReceived(
    topic: string,
    partition: number,
    message: {
      key?: Buffer | string | null;
      value: Buffer | string | null;
      headers?: Record<string, string | Buffer>;
      timestamp?: string;
      offset?: string;
    }
  ): Promise<void> {
    if (!this.running || !this.messageHandler) {
      throw new Error('Consumer is not running or no message handler is registered');
    }

    if (!this.subscribedTopics.includes(topic)) {
      throw new Error(`Consumer is not subscribed to topic: ${topic}`);
    }

    await this.messageHandler({
      topic,
      partition,
      message: {
        key: message.key || null,
        value: message.value,
        headers: message.headers || {},
        timestamp: message.timestamp || Date.now().toString(),
        offset: message.offset || '0',
        size: 0,
        attributes: 0,
      },
    });
  }

  /**
   * Simulates receiving a batch of messages
   * 
   * @param topic - The topic the messages are from
   * @param partition - The partition the messages are from
   * @param messages - The message contents
   * @returns A promise that resolves when the messages are processed
   */
  public async simulateBatchMessagesReceived(
    topic: string,
    partition: number,
    messages: Array<{
      key?: Buffer | string | null;
      value: Buffer | string | null;
      headers?: Record<string, string | Buffer>;
      timestamp?: string;
      offset?: string;
    }>
  ): Promise<void> {
    if (!this.running || !this.batchMessageHandler) {
      throw new Error('Consumer is not running or no batch message handler is registered');
    }

    if (!this.subscribedTopics.includes(topic)) {
      throw new Error(`Consumer is not subscribed to topic: ${topic}`);
    }

    await this.batchMessageHandler({
      batch: {
        topic,
        partition,
        highWatermark: '100',
        messages: messages.map((msg, index) => ({
          key: msg.key || null,
          value: msg.value,
          headers: msg.headers || {},
          timestamp: msg.timestamp || Date.now().toString(),
          offset: msg.offset || index.toString(),
          size: 0,
          attributes: 0,
        })),
      },
      resolveOffset: jest.fn(),
      heartbeat: jest.fn(),
      commitOffsetsIfNecessary: jest.fn(),
      uncommittedOffsets: jest.fn().mockReturnValue({}),
      isRunning: jest.fn().mockReturnValue(this.running),
      isStale: jest.fn().mockReturnValue(false),
    });
  }

  /**
   * Gets the logger instance (not implemented in mock)
   */
  public logger(): any {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setLogLevel: jest.fn(),
    };
  }

  /**
   * Gets the events instance (not implemented in mock)
   */
  public events(): any {
    return {};
  }
}

/**
 * Mock implementation of the KafkaJS Admin client
 */
export class MockAdmin extends EventEmitter implements Admin {
  /**
   * The parent Kafka client
   */
  private readonly client: MockKafkaClient;

  /**
   * The admin options
   */
  private readonly options: any;

  /**
   * Configuration for the mock behavior
   */
  private config: MockKafkaClientConfig;

  /**
   * Whether the admin client is connected
   */
  private connected = false;

  /**
   * Track calls to methods for assertions
   */
  public readonly calls: {
    connect: number;
    disconnect: number;
    createTopics: number;
    deleteTopics: number;
    createPartitions: number;
    fetchTopicMetadata: number;
    fetchOffsets: number;
    fetchTopicOffsets: number;
    fetchTopicOffsetsByTimestamp: number;
    setOffsets: number;
    resetOffsets: number;
    describeGroups: number;
    deleteGroups: number;
    listGroups: number;
  } = {
    connect: 0,
    disconnect: 0,
    createTopics: 0,
    deleteTopics: 0,
    createPartitions: 0,
    fetchTopicMetadata: 0,
    fetchOffsets: 0,
    fetchTopicOffsets: 0,
    fetchTopicOffsetsByTimestamp: 0,
    setOffsets: 0,
    resetOffsets: 0,
    describeGroups: 0,
    deleteGroups: 0,
    listGroups: 0,
  };

  /**
   * Topics created by this admin client
   */
  public readonly createdTopics: Array<{
    topic: string;
    numPartitions?: number;
    replicationFactor?: number;
    configEntries?: Array<{ name: string; value: string }>;
  }> = [];

  /**
   * Topics deleted by this admin client
   */
  public readonly deletedTopics: string[] = [];

  /**
   * Creates a new MockAdmin instance
   * 
   * @param client - The parent Kafka client
   * @param options - Admin options
   * @param config - Configuration for the mock behavior
   */
  constructor(
    client: MockKafkaClient,
    options: any,
    config: MockKafkaClientConfig
  ) {
    super();
    this.client = client;
    this.options = options;
    this.config = config;
  }

  /**
   * Connects the admin client to the Kafka broker
   * 
   * @returns A promise that resolves when connected
   */
  public async connect(): Promise<void> {
    this.calls.connect++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldConnectSucceed) {
      throw this.config.errorToThrow;
    }

    this.connected = true;
    this.emit('connect');
  }

  /**
   * Disconnects the admin client from the Kafka broker
   * 
   * @returns A promise that resolves when disconnected
   */
  public async disconnect(): Promise<void> {
    this.calls.disconnect++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldDisconnectSucceed) {
      throw this.config.errorToThrow;
    }

    this.connected = false;
    this.emit('disconnect');
  }

  /**
   * Creates Kafka topics
   * 
   * @param options - Topic creation options
   * @returns A promise that resolves when topics are created
   */
  public async createTopics(options: {
    topics: Array<{
      topic: string;
      numPartitions?: number;
      replicationFactor?: number;
      configEntries?: Array<{ name: string; value: string }>;
    }>;
    timeout?: number;
    validateOnly?: boolean;
  }): Promise<boolean> {
    this.calls.createTopics++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    for (const topic of options.topics) {
      this.createdTopics.push({ ...topic });
    }

    return true;
  }

  /**
   * Deletes Kafka topics
   * 
   * @param options - Topic deletion options
   * @returns A promise that resolves when topics are deleted
   */
  public async deleteTopics(options: {
    topics: string[];
    timeout?: number;
  }): Promise<void> {
    this.calls.deleteTopics++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    for (const topic of options.topics) {
      this.deletedTopics.push(topic);
    }
  }

  /**
   * Creates partitions for topics
   * 
   * @param options - Partition creation options
   * @returns A promise that resolves when partitions are created
   */
  public async createPartitions(options: {
    topicPartitions: Array<{
      topic: string;
      count: number;
    }>;
    timeout?: number;
    validateOnly?: boolean;
  }): Promise<boolean> {
    this.calls.createPartitions++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    return true;
  }

  /**
   * Fetches topic metadata
   * 
   * @param options - Metadata fetch options
   * @returns A promise that resolves with the topic metadata
   */
  public async fetchTopicMetadata(options?: {
    topics?: string[];
  }): Promise<{
    topics: Array<{
      name: string;
      partitions: Array<{
        partitionId: number;
        leader: number;
        replicas: number[];
        isr: number[];
        offlineReplicas: number[];
      }>;
    }>;
  }> {
    this.calls.fetchTopicMetadata++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    const topics = options?.topics || this.createdTopics.map(t => t.topic);

    return {
      topics: topics.map(topic => ({
        name: topic,
        partitions: Array.from({ length: 1 }, (_, i) => ({
          partitionId: i,
          leader: 0,
          replicas: [0],
          isr: [0],
          offlineReplicas: [],
        })),
      })),
    };
  }

  /**
   * Fetches consumer group offsets
   * 
   * @param options - Offset fetch options
   * @returns A promise that resolves with the consumer group offsets
   */
  public async fetchOffsets(options: {
    groupId: string;
    topics: string[];
  }): Promise<Array<{
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
      metadata: string | null;
    }>;
  }>> {
    this.calls.fetchOffsets++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    return options.topics.map(topic => ({
      topic,
      partitions: [{
        partition: 0,
        offset: '0',
        metadata: null,
      }],
    }));
  }

  /**
   * Fetches topic offsets
   * 
   * @param options - Topic offset fetch options
   * @returns A promise that resolves with the topic offsets
   */
  public async fetchTopicOffsets(topic: string): Promise<Array<{
    partition: number;
    offset: string;
    high: string;
    low: string;
  }>> {
    this.calls.fetchTopicOffsets++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    return [{
      partition: 0,
      offset: '0',
      high: '0',
      low: '0',
    }];
  }

  /**
   * Fetches topic offsets by timestamp
   * 
   * @param options - Topic offset fetch options
   * @returns A promise that resolves with the topic offsets
   */
  public async fetchTopicOffsetsByTimestamp(
    topic: string,
    timestamp: number
  ): Promise<Array<{
    partition: number;
    offset: string;
  }>> {
    this.calls.fetchTopicOffsetsByTimestamp++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    return [{
      partition: 0,
      offset: '0',
    }];
  }

  /**
   * Sets consumer group offsets
   * 
   * @param options - Offset set options
   * @returns A promise that resolves when offsets are set
   */
  public async setOffsets(options: {
    groupId: string;
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }): Promise<void> {
    this.calls.setOffsets++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }
  }

  /**
   * Resets consumer group offsets
   * 
   * @param options - Offset reset options
   * @returns A promise that resolves when offsets are reset
   */
  public async resetOffsets(options: {
    groupId: string;
    topic: string;
    earliest?: boolean;
    latest?: boolean;
  }): Promise<void> {
    this.calls.resetOffsets++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }
  }

  /**
   * Describes consumer groups
   * 
   * @param options - Group description options
   * @returns A promise that resolves with the consumer group descriptions
   */
  public async describeGroups(options: {
    groupIds: string[];
  }): Promise<Array<{
    groupId: string;
    members: Array<{
      memberId: string;
      clientId: string;
      clientHost: string;
      memberMetadata: Buffer;
      memberAssignment: Buffer;
    }>;
    protocol: string;
    protocolType: string;
    state: string;
  }>> {
    this.calls.describeGroups++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    return options.groupIds.map(groupId => ({
      groupId,
      members: [],
      protocol: '',
      protocolType: '',
      state: 'Stable',
    }));
  }

  /**
   * Deletes consumer groups
   * 
   * @param options - Group deletion options
   * @returns A promise that resolves when groups are deleted
   */
  public async deleteGroups(options: {
    groupIds: string[];
  }): Promise<{
    groupIds: string[];
    errorCodes: number[];
  }> {
    this.calls.deleteGroups++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    return {
      groupIds: options.groupIds,
      errorCodes: options.groupIds.map(() => 0),
    };
  }

  /**
   * Lists consumer groups
   * 
   * @returns A promise that resolves with the consumer group list
   */
  public async listGroups(): Promise<{
    groups: Array<{
      groupId: string;
      protocolType: string;
    }>;
  }> {
    this.calls.listGroups++;
    
    if (this.config.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
    }

    if (!this.config.shouldAdminOperationsSucceed) {
      throw this.config.errorToThrow;
    }

    return {
      groups: [],
    };
  }

  /**
   * Checks if the admin client is connected
   * 
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets the logger instance (not implemented in mock)
   */
  public logger(): any {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setLogLevel: jest.fn(),
    };
  }
}
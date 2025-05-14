/**
 * Mock implementation of the KafkaJS client for unit testing.
 * 
 * This mock simulates the behavior of a real Kafka client without requiring an actual Kafka connection,
 * allowing tests to run in isolation. It implements the core Kafka client interface, including
 * connect/disconnect methods and factories for producers and consumers.
 */

import { 
  Kafka, 
  KafkaConfig, 
  Producer, 
  Consumer, 
  ConsumerConfig, 
  ProducerConfig,
  Admin,
  AdminConfig,
  TopicMessages,
  RecordMetadata,
  EachMessagePayload,
  EachBatchPayload,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  Message,
  IHeaders,
  KafkaMessage
} from 'kafkajs';

/**
 * Interfaces for tracking method calls
 */
export interface MethodCall {
  method: string;
  args: any[];
  timestamp: number;
}

export interface MockCallHistory {
  calls: MethodCall[];
  connectCalls: number;
  disconnectCalls: number;
}

/**
 * Interface for configuring mock responses
 */
export interface MockResponse {
  success: boolean;
  error?: Error;
  data?: any;
}

/**
 * Interface for configuring mock producer responses
 */
export interface MockProducerConfig {
  connect?: MockResponse;
  disconnect?: MockResponse;
  send?: MockResponse;
}

/**
 * Interface for configuring mock consumer responses
 */
export interface MockConsumerConfig {
  connect?: MockResponse;
  disconnect?: MockResponse;
  subscribe?: MockResponse;
  run?: MockResponse;
}

/**
 * Interface for configuring mock admin responses
 */
export interface MockAdminConfig {
  connect?: MockResponse;
  disconnect?: MockResponse;
  createTopics?: MockResponse;
  deleteTopics?: MockResponse;
  fetchTopicMetadata?: MockResponse;
}

/**
 * Interface for configuring the mock Kafka client
 */
export interface MockKafkaConfig {
  producer?: MockProducerConfig;
  consumer?: MockConsumerConfig;
  admin?: MockAdminConfig;
}

/**
 * In-memory message store for simulating message production and consumption
 */
export class MessageStore {
  private messages: Map<string, KafkaMessage[]> = new Map();

  /**
   * Add a message to a topic
   */
  addMessage(topic: string, message: Message): void {
    if (!this.messages.has(topic)) {
      this.messages.set(topic, []);
    }

    const kafkaMessage: KafkaMessage = {
      key: message.key ? Buffer.from(message.key) : null,
      value: message.value ? Buffer.from(message.value) : null,
      timestamp: Date.now().toString(),
      size: 0,
      attributes: 0,
      offset: this.messages.get(topic)!.length.toString(),
      headers: message.headers as IHeaders || {}
    };

    this.messages.get(topic)!.push(kafkaMessage);
  }

  /**
   * Get all messages for a topic
   */
  getMessages(topic: string): KafkaMessage[] {
    return this.messages.get(topic) || [];
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages.clear();
  }

  /**
   * Clear messages for a specific topic
   */
  clearTopic(topic: string): void {
    this.messages.delete(topic);
  }
}

/**
 * Mock implementation of the KafkaJS Producer
 */
export class MockProducer implements Producer {
  private config: ProducerConfig;
  private mockConfig: MockProducerConfig;
  private messageStore: MessageStore;
  public callHistory: MockCallHistory = {
    calls: [],
    connectCalls: 0,
    disconnectCalls: 0
  };

  constructor(config: ProducerConfig, mockConfig: MockProducerConfig = {}, messageStore: MessageStore) {
    this.config = config;
    this.mockConfig = mockConfig;
    this.messageStore = messageStore;
  }

  /**
   * Track method calls for testing assertions
   */
  private trackMethodCall(method: string, args: any[] = []): void {
    this.callHistory.calls.push({
      method,
      args,
      timestamp: Date.now()
    });
  }

  /**
   * Connect to the Kafka broker (mock implementation)
   */
  async connect(): Promise<void> {
    this.trackMethodCall('connect');
    this.callHistory.connectCalls++;

    if (this.mockConfig.connect?.success === false) {
      throw this.mockConfig.connect.error || new Error('Mock connect error');
    }
  }

  /**
   * Disconnect from the Kafka broker (mock implementation)
   */
  async disconnect(): Promise<void> {
    this.trackMethodCall('disconnect');
    this.callHistory.disconnectCalls++;

    if (this.mockConfig.disconnect?.success === false) {
      throw this.mockConfig.disconnect.error || new Error('Mock disconnect error');
    }
  }

  /**
   * Send messages to a topic (mock implementation)
   */
  async send({
    topic,
    messages,
    acks,
    timeout,
    compression
  }: TopicMessages): Promise<RecordMetadata[]> {
    this.trackMethodCall('send', [{ topic, messages, acks, timeout, compression }]);

    if (this.mockConfig.send?.success === false) {
      throw this.mockConfig.send.error || new Error('Mock send error');
    }

    // Store messages in the message store
    for (const message of messages) {
      this.messageStore.addMessage(topic, message);
    }

    // Return mock record metadata
    return messages.map((_, index) => ({
      topicName: topic,
      partition: 0,
      errorCode: 0,
      baseOffset: index.toString(),
      logAppendTime: '-1',
      logStartOffset: '0'
    }));
  }

  /**
   * Send messages to multiple topics (mock implementation)
   */
  async sendBatch({
    topicMessages,
    acks,
    timeout,
    compression
  }: {
    topicMessages: TopicMessages[];
    acks?: number;
    timeout?: number;
    compression?: any;
  }): Promise<RecordMetadata[]> {
    this.trackMethodCall('sendBatch', [{ topicMessages, acks, timeout, compression }]);

    if (this.mockConfig.send?.success === false) {
      throw this.mockConfig.send.error || new Error('Mock sendBatch error');
    }

    const allMetadata: RecordMetadata[] = [];

    for (const { topic, messages } of topicMessages) {
      // Store messages in the message store
      for (const message of messages) {
        this.messageStore.addMessage(topic, message);
      }

      // Add mock record metadata
      const metadata = messages.map((_, index) => ({
        topicName: topic,
        partition: 0,
        errorCode: 0,
        baseOffset: index.toString(),
        logAppendTime: '-1',
        logStartOffset: '0'
      }));

      allMetadata.push(...metadata);
    }

    return allMetadata;
  }

  /**
   * Transaction methods (minimal implementation)
   */
  transaction = () => {
    this.trackMethodCall('transaction');
    return {
      send: async () => [],
      sendBatch: async () => [],
      commit: async () => {},
      abort: async () => {},
      isActive: () => false
    };
  };

  /**
   * Events (minimal implementation)
   */
  events = {
    connect: () => {},
    disconnect: () => {},
    request: () => {},
    requestTimeout: () => {},
    requestQueueSize: () => {}
  };

  on(): void {}
  off(): void {}
  logger(): void {}
}

/**
 * Mock implementation of the KafkaJS Consumer
 */
export class MockConsumer implements Consumer {
  private config: ConsumerConfig;
  private mockConfig: MockConsumerConfig;
  private messageStore: MessageStore;
  private subscribedTopics: string[] = [];
  private runConfig: ConsumerRunConfig | null = null;
  private isRunning = false;
  public callHistory: MockCallHistory = {
    calls: [],
    connectCalls: 0,
    disconnectCalls: 0
  };

  constructor(config: ConsumerConfig, mockConfig: MockConsumerConfig = {}, messageStore: MessageStore) {
    this.config = config;
    this.mockConfig = mockConfig;
    this.messageStore = messageStore;
  }

  /**
   * Track method calls for testing assertions
   */
  private trackMethodCall(method: string, args: any[] = []): void {
    this.callHistory.calls.push({
      method,
      args,
      timestamp: Date.now()
    });
  }

  /**
   * Connect to the Kafka broker (mock implementation)
   */
  async connect(): Promise<void> {
    this.trackMethodCall('connect');
    this.callHistory.connectCalls++;

    if (this.mockConfig.connect?.success === false) {
      throw this.mockConfig.connect.error || new Error('Mock connect error');
    }
  }

  /**
   * Disconnect from the Kafka broker (mock implementation)
   */
  async disconnect(): Promise<void> {
    this.trackMethodCall('disconnect');
    this.callHistory.disconnectCalls++;
    this.isRunning = false;

    if (this.mockConfig.disconnect?.success === false) {
      throw this.mockConfig.disconnect.error || new Error('Mock disconnect error');
    }
  }

  /**
   * Subscribe to topics (mock implementation)
   */
  async subscribe({ topics, fromBeginning }: ConsumerSubscribeTopics): Promise<void> {
    this.trackMethodCall('subscribe', [{ topics, fromBeginning }]);

    if (this.mockConfig.subscribe?.success === false) {
      throw this.mockConfig.subscribe.error || new Error('Mock subscribe error');
    }

    // Store subscribed topics
    if (Array.isArray(topics)) {
      this.subscribedTopics = topics;
    } else if (typeof topics === 'string') {
      this.subscribedTopics = [topics];
    } else if (topics instanceof RegExp) {
      // For RegExp, we can't determine the actual topics without a real broker
      // In a real test, you would need to explicitly provide the topics that match the pattern
      this.subscribedTopics = [];
    }
  }

  /**
   * Run the consumer (mock implementation)
   */
  async run(config: ConsumerRunConfig): Promise<void> {
    this.trackMethodCall('run', [config]);

    if (this.mockConfig.run?.success === false) {
      throw this.mockConfig.run.error || new Error('Mock run error');
    }

    this.runConfig = config;
    this.isRunning = true;

    // Process existing messages for subscribed topics
    if (config.eachMessage && this.subscribedTopics.length > 0) {
      for (const topic of this.subscribedTopics) {
        const messages = this.messageStore.getMessages(topic);
        
        for (const message of messages) {
          const payload: EachMessagePayload = {
            topic,
            partition: 0,
            message
          };

          try {
            await config.eachMessage(payload);
          } catch (error) {
            console.error(`Error processing message: ${error}`);
          }
        }
      }
    } else if (config.eachBatch && this.subscribedTopics.length > 0) {
      for (const topic of this.subscribedTopics) {
        const messages = this.messageStore.getMessages(topic);
        
        if (messages.length > 0) {
          const payload: EachBatchPayload = {
            batch: {
              topic,
              partition: 0,
              messages,
              isEmpty: () => messages.length === 0,
              firstOffset: () => messages[0]?.offset || '0',
              lastOffset: () => messages[messages.length - 1]?.offset || '0',
              offsetLag: () => 0,
              offsetLagLow: () => 0,
              highWatermark: '0'
            },
            resolveOffset: () => {},
            heartbeat: async () => {},
            commitOffsetsIfNecessary: async () => {},
            uncommittedOffsets: () => ({ topics: [] }),
            isRunning: () => this.isRunning,
            isStale: () => false
          };

          try {
            await config.eachBatch(payload);
          } catch (error) {
            console.error(`Error processing batch: ${error}`);
          }
        }
      }
    }
  }

  /**
   * Stop the consumer (mock implementation)
   */
  async stop(): Promise<void> {
    this.trackMethodCall('stop');
    this.isRunning = false;
  }

  /**
   * Seek to a specific offset (mock implementation)
   */
  async seek({ topic, partition, offset }: { topic: string; partition: number; offset: string }): Promise<void> {
    this.trackMethodCall('seek', [{ topic, partition, offset }]);
  }

  /**
   * Pause consuming from specific topics/partitions (mock implementation)
   */
  async pause(topics: Array<{ topic: string; partitions?: number[] }>): Promise<void> {
    this.trackMethodCall('pause', [topics]);
  }

  /**
   * Resume consuming from specific topics/partitions (mock implementation)
   */
  async resume(topics: Array<{ topic: string; partitions?: number[] }>): Promise<void> {
    this.trackMethodCall('resume', [topics]);
  }

  /**
   * Commit offsets (mock implementation)
   */
  async commitOffsets(
    offsets: Array<{ topic: string; partition: number; offset: string }>
  ): Promise<void> {
    this.trackMethodCall('commitOffsets', [offsets]);
  }

  /**
   * Events (minimal implementation)
   */
  events = {
    connect: () => {},
    disconnect: () => {},
    request: () => {},
    requestTimeout: () => {},
    requestQueueSize: () => {},
    group: {
      join: () => {},
      leave: () => {},
      start: () => {}
    },
    fetch: () => {},
    start: () => {},
    stop: () => {},
    crash: () => {},
    heartbeat: () => {},
    commitOffsets: () => {},
    offsetsToCommit: () => {},
    rebalancing: () => {},
    rebalance: {
      start: () => {},
      end: () => {},
      error: () => {}
    }
  };

  on(): void {}
  off(): void {}
  logger(): void {}
}

/**
 * Mock implementation of the KafkaJS Admin
 */
export class MockAdmin implements Admin {
  private config: AdminConfig;
  private mockConfig: MockAdminConfig;
  public callHistory: MockCallHistory = {
    calls: [],
    connectCalls: 0,
    disconnectCalls: 0
  };

  constructor(config: AdminConfig, mockConfig: MockAdminConfig = {}) {
    this.config = config;
    this.mockConfig = mockConfig;
  }

  /**
   * Track method calls for testing assertions
   */
  private trackMethodCall(method: string, args: any[] = []): void {
    this.callHistory.calls.push({
      method,
      args,
      timestamp: Date.now()
    });
  }

  /**
   * Connect to the Kafka broker (mock implementation)
   */
  async connect(): Promise<void> {
    this.trackMethodCall('connect');
    this.callHistory.connectCalls++;

    if (this.mockConfig.connect?.success === false) {
      throw this.mockConfig.connect.error || new Error('Mock connect error');
    }
  }

  /**
   * Disconnect from the Kafka broker (mock implementation)
   */
  async disconnect(): Promise<void> {
    this.trackMethodCall('disconnect');
    this.callHistory.disconnectCalls++;

    if (this.mockConfig.disconnect?.success === false) {
      throw this.mockConfig.disconnect.error || new Error('Mock disconnect error');
    }
  }

  /**
   * Create topics (mock implementation)
   */
  async createTopics({
    topics,
    waitForLeaders = true,
    timeout
  }: {
    topics: Array<{ topic: string; numPartitions?: number; replicationFactor?: number; replicaAssignment?: any[] }>,
    waitForLeaders?: boolean,
    timeout?: number
  }): Promise<boolean> {
    this.trackMethodCall('createTopics', [{ topics, waitForLeaders, timeout }]);

    if (this.mockConfig.createTopics?.success === false) {
      throw this.mockConfig.createTopics.error || new Error('Mock createTopics error');
    }

    return true;
  }

  /**
   * Delete topics (mock implementation)
   */
  async deleteTopics({
    topics,
    timeout
  }: {
    topics: string[],
    timeout?: number
  }): Promise<void> {
    this.trackMethodCall('deleteTopics', [{ topics, timeout }]);

    if (this.mockConfig.deleteTopics?.success === false) {
      throw this.mockConfig.deleteTopics.error || new Error('Mock deleteTopics error');
    }
  }

  /**
   * Fetch topic metadata (mock implementation)
   */
  async fetchTopicMetadata({
    topics = [],
    timeout
  }: {
    topics?: string[],
    timeout?: number
  } = {}): Promise<{
    topics: Array<{
      name: string,
      partitions: Array<{
        partitionId: number,
        leader: number,
        replicas: number[],
        isr: number[]
      }>
    }>
  }> {
    this.trackMethodCall('fetchTopicMetadata', [{ topics, timeout }]);

    if (this.mockConfig.fetchTopicMetadata?.success === false) {
      throw this.mockConfig.fetchTopicMetadata.error || new Error('Mock fetchTopicMetadata error');
    }

    // Return mock topic metadata
    return {
      topics: topics.map(topic => ({
        name: topic,
        partitions: [
          {
            partitionId: 0,
            leader: 0,
            replicas: [0],
            isr: [0]
          }
        ]
      }))
    };
  }

  /**
   * Events (minimal implementation)
   */
  events = {
    connect: () => {},
    disconnect: () => {},
    request: () => {},
    requestTimeout: () => {},
    requestQueueSize: () => {}
  };

  on(): void {}
  off(): void {}
  logger(): void {}
}

/**
 * Mock implementation of the KafkaJS client
 */
export class MockKafka implements Kafka {
  private config: KafkaConfig;
  private mockConfig: MockKafkaConfig;
  private messageStore: MessageStore = new MessageStore();
  public callHistory: MockCallHistory = {
    calls: [],
    connectCalls: 0,
    disconnectCalls: 0
  };

  constructor(config: KafkaConfig, mockConfig: MockKafkaConfig = {}) {
    this.config = config;
    this.mockConfig = mockConfig;
  }

  /**
   * Track method calls for testing assertions
   */
  private trackMethodCall(method: string, args: any[] = []): void {
    this.callHistory.calls.push({
      method,
      args,
      timestamp: Date.now()
    });
  }

  /**
   * Create a producer (mock implementation)
   */
  producer(config: ProducerConfig = {}): Producer {
    this.trackMethodCall('producer', [config]);
    return new MockProducer(config, this.mockConfig.producer, this.messageStore);
  }

  /**
   * Create a consumer (mock implementation)
   */
  consumer(config: ConsumerConfig): Consumer {
    this.trackMethodCall('consumer', [config]);
    return new MockConsumer(config, this.mockConfig.consumer, this.messageStore);
  }

  /**
   * Create an admin client (mock implementation)
   */
  admin(config: AdminConfig = {}): Admin {
    this.trackMethodCall('admin', [config]);
    return new MockAdmin(config, this.mockConfig.admin);
  }

  /**
   * Get the message store for testing
   */
  getMessageStore(): MessageStore {
    return this.messageStore;
  }

  /**
   * Clear all messages from the message store
   */
  clearMessages(): void {
    this.messageStore.clear();
  }

  /**
   * Clear messages for a specific topic
   */
  clearTopicMessages(topic: string): void {
    this.messageStore.clearTopic(topic);
  }
}
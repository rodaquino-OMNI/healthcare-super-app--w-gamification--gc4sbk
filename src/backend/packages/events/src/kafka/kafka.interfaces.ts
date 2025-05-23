/**
 * @file Kafka interfaces for event processing
 * @description Defines core TypeScript interfaces for Kafka operations used throughout the application.
 * These interfaces provide contracts for implementation and enable dependency injection with proper typing.
 */

import { IBaseEvent } from '../../interfaces/event.interface';
import { Observable } from 'rxjs';

/**
 * Kafka configuration options interface
 * Defines the structure for Kafka client configuration
 */
export interface IKafkaConfig {
  /**
   * List of Kafka broker addresses
   * @example ['localhost:9092', 'broker2:9092']
   */
  brokers: string[];

  /**
   * Client ID for this Kafka client instance
   * @example 'health-service-client'
   */
  clientId: string;

  /**
   * Consumer group ID for this client
   * @example 'health-service-group'
   */
  groupId?: string;

  /**
   * SSL configuration for secure connections
   */
  ssl?: IKafkaSSLConfig;

  /**
   * SASL authentication configuration
   */
  sasl?: IKafkaSASLConfig;

  /**
   * Connection timeout in milliseconds
   * @default 1000
   */
  connectionTimeout?: number;

  /**
   * Authentication timeout in milliseconds
   * @default 1000
   */
  authenticationTimeout?: number;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  requestTimeout?: number;

  /**
   * Maximum number of retries for failed requests
   * @default 5
   */
  retry?: IKafkaRetryConfig;

  /**
   * Metadata refresh interval in milliseconds
   * @default 300000 (5 minutes)
   */
  metadataMaxAge?: number;

  /**
   * Whether to allow auto-topic creation
   * @default false
   */
  allowAutoTopicCreation?: boolean;

  /**
   * Maximum size of a request in bytes
   * @default 1048576 (1MB)
   */
  maxInFlightRequests?: number;

  /**
   * Transaction configuration for transactional producers
   */
  transactions?: IKafkaTransactionConfig;
}

/**
 * Kafka SSL configuration interface
 */
export interface IKafkaSSLConfig {
  /**
   * Whether to enable SSL
   * @default false
   */
  enabled?: boolean;

  /**
   * Path to CA certificate file
   */
  ca?: string;

  /**
   * Path to client certificate file
   */
  cert?: string;

  /**
   * Path to client key file
   */
  key?: string;

  /**
   * Passphrase for the client key
   */
  passphrase?: string;

  /**
   * Whether to reject unauthorized connections
   * @default true
   */
  rejectUnauthorized?: boolean;
}

/**
 * Kafka SASL authentication configuration interface
 */
export interface IKafkaSASLConfig {
  /**
   * SASL mechanism
   * @example 'plain', 'scram-sha-256', 'scram-sha-512'
   */
  mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';

  /**
   * SASL username
   */
  username: string;

  /**
   * SASL password
   */
  password: string;
}

/**
 * Kafka retry configuration interface
 */
export interface IKafkaRetryConfig {
  /**
   * Initial retry delay in milliseconds
   * @default 300
   */
  initialRetryTime?: number;

  /**
   * Maximum retry time in milliseconds
   * @default 30000
   */
  maxRetryTime?: number;

  /**
   * Factor by which retry time increases
   * @default 2
   */
  retryFactor?: number;

  /**
   * Maximum number of retries
   * @default 5
   */
  maxRetries?: number;

  /**
   * Whether to retry indefinitely
   * @default false
   */
  retryForever?: boolean;
}

/**
 * Kafka transaction configuration interface
 */
export interface IKafkaTransactionConfig {
  /**
   * Transaction ID prefix
   * @example 'health-service-tx'
   */
  id: string;

  /**
   * Transaction timeout in milliseconds
   * @default 60000 (1 minute)
   */
  timeout?: number;
}

/**
 * Kafka message headers interface
 */
export interface IKafkaHeaders {
  /**
   * Message headers as key-value pairs
   */
  [key: string]: string | Buffer;
}

/**
 * Kafka message interface
 * Defines the structure of messages sent to and received from Kafka
 */
export interface IKafkaMessage<T = any> {
  /**
   * Topic the message belongs to
   */
  topic: string;

  /**
   * Partition the message belongs to
   */
  partition?: number;

  /**
   * Message key (used for partitioning)
   */
  key?: string | Buffer;

  /**
   * Message value (payload)
   */
  value: T;

  /**
   * Message headers
   */
  headers?: IKafkaHeaders;

  /**
   * Message timestamp
   */
  timestamp?: string;

  /**
   * Message offset in the partition
   */
  offset?: string;
}

/**
 * Kafka message with event payload interface
 * Specialization of IKafkaMessage for event payloads
 */
export interface IKafkaEventMessage extends IKafkaMessage<IBaseEvent> {
  /**
   * Event payload as the message value
   */
  value: IBaseEvent;
}

/**
 * Kafka producer interface
 * Defines the contract for Kafka message producers
 */
export interface IKafkaProducer {
  /**
   * Connect to the Kafka broker
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the Kafka broker
   * @returns Promise that resolves when disconnected
   */
  disconnect(): Promise<void>;

  /**
   * Send a message to a Kafka topic
   * @param message The message to send
   * @returns Promise that resolves with the message metadata
   */
  send<T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord>;

  /**
   * Send a batch of messages to Kafka topics
   * @param messages Array of messages to send
   * @returns Promise that resolves with the batch metadata
   */
  sendBatch<T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord>;

  /**
   * Send an event to a Kafka topic
   * @param topic The topic to send to
   * @param event The event to send
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Promise that resolves with the message metadata
   */
  sendEvent(topic: string, event: IBaseEvent, key?: string, headers?: IKafkaHeaders): Promise<IKafkaProducerRecord>;

  /**
   * Begin a transaction
   * @returns Promise that resolves with a transaction object
   */
  transaction(): Promise<IKafkaTransaction>;

  /**
   * Check if the producer is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean;
}

/**
 * Kafka producer record interface
 * Contains metadata about a produced message
 */
export interface IKafkaProducerRecord {
  /**
   * Topic the message was sent to
   */
  topic: string;

  /**
   * Partition the message was sent to
   */
  partition: number;

  /**
   * Message offset in the partition
   */
  offset?: string;

  /**
   * Message timestamp
   */
  timestamp?: string;

  /**
   * Error if the message failed to send
   */
  error?: Error;
}

/**
 * Kafka producer batch record interface
 * Contains metadata about a batch of produced messages
 */
export interface IKafkaProducerBatchRecord {
  /**
   * Array of records for each message in the batch
   */
  records: IKafkaProducerRecord[];

  /**
   * Error if the batch failed to send
   */
  error?: Error;
}

/**
 * Kafka transaction interface
 * Defines the contract for Kafka transactions
 */
export interface IKafkaTransaction {
  /**
   * Send a message within this transaction
   * @param message The message to send
   * @returns Promise that resolves with the message metadata
   */
  send<T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord>;

  /**
   * Send a batch of messages within this transaction
   * @param messages Array of messages to send
   * @returns Promise that resolves with the batch metadata
   */
  sendBatch<T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord>;

  /**
   * Commit the transaction
   * @returns Promise that resolves when the transaction is committed
   */
  commit(): Promise<void>;

  /**
   * Abort the transaction
   * @returns Promise that resolves when the transaction is aborted
   */
  abort(): Promise<void>;
}

/**
 * Kafka consumer interface
 * Defines the contract for Kafka message consumers
 */
export interface IKafkaConsumer {
  /**
   * Connect to the Kafka broker
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the Kafka broker
   * @returns Promise that resolves when disconnected
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to Kafka topics
   * @param topics Array of topics to subscribe to
   * @returns Promise that resolves when subscribed
   */
  subscribe(topics: string[]): Promise<void>;

  /**
   * Consume messages from subscribed topics
   * @param options Consumption options
   * @returns Observable that emits consumed messages
   */
  consume<T = any>(options?: IKafkaConsumerOptions): Observable<IKafkaMessage<T>>;

  /**
   * Commit consumed message offsets
   * @param message The message to commit
   * @returns Promise that resolves when offsets are committed
   */
  commit(message: IKafkaMessage): Promise<void>;

  /**
   * Seek to a specific offset in a partition
   * @param topic The topic to seek in
   * @param partition The partition to seek in
   * @param offset The offset to seek to
   * @returns Promise that resolves when the seek is complete
   */
  seek(topic: string, partition: number, offset: string): Promise<void>;

  /**
   * Pause consumption from specific topics/partitions
   * @param topicPartitions Array of topic-partitions to pause
   * @returns Promise that resolves when consumption is paused
   */
  pause(topicPartitions: IKafkaTopicPartition[]): Promise<void>;

  /**
   * Resume consumption from specific topics/partitions
   * @param topicPartitions Array of topic-partitions to resume
   * @returns Promise that resolves when consumption is resumed
   */
  resume(topicPartitions: IKafkaTopicPartition[]): Promise<void>;

  /**
   * Check if the consumer is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean;
}

/**
 * Kafka consumer options interface
 */
export interface IKafkaConsumerOptions {
  /**
   * Whether to automatically commit offsets
   * @default true
   */
  autoCommit?: boolean;

  /**
   * Auto-commit interval in milliseconds
   * @default 5000
   */
  autoCommitInterval?: number;

  /**
   * Whether to automatically commit on disconnect
   * @default true
   */
  autoCommitOnDisconnect?: boolean;

  /**
   * Maximum number of messages to consume in one batch
   * @default 100
   */
  maxBatchSize?: number;

  /**
   * Maximum number of bytes to consume in one batch
   * @default 1048576 (1MB)
   */
  maxBatchBytes?: number;

  /**
   * Maximum time to wait for a full batch in milliseconds
   * @default 1000
   */
  maxWaitTimeMs?: number;

  /**
   * Whether to consume from the beginning of the topic
   * @default false
   */
  fromBeginning?: boolean;

  /**
   * Partition assignment strategy
   * @default 'range'
   */
  partitionAssignmentStrategy?: 'range' | 'roundrobin' | 'cooperative-sticky';
}

/**
 * Kafka topic-partition interface
 */
export interface IKafkaTopicPartition {
  /**
   * Topic name
   */
  topic: string;

  /**
   * Partition number
   */
  partition: number;
}

/**
 * Kafka message handler interface
 * Defines the contract for message processing handlers
 */
export interface IKafkaMessageHandler<T = any> {
  /**
   * Handle a Kafka message
   * @param message The message to handle
   * @returns Promise that resolves when the message is handled
   */
  handle(message: IKafkaMessage<T>): Promise<void>;

  /**
   * Handle a batch of Kafka messages
   * @param messages Array of messages to handle
   * @returns Promise that resolves when all messages are handled
   */
  handleBatch?(messages: IKafkaMessage<T>[]): Promise<void>;

  /**
   * Handle an error that occurred during message processing
   * @param error The error that occurred
   * @param message The message that caused the error
   * @returns Promise that resolves when the error is handled
   */
  handleError?(error: Error, message: IKafkaMessage<T>): Promise<void>;
}

/**
 * Kafka event handler interface
 * Specialization of IKafkaMessageHandler for event messages
 */
export interface IKafkaEventHandler extends IKafkaMessageHandler<IBaseEvent> {
  /**
   * Handle a Kafka event message
   * @param message The event message to handle
   * @returns Promise that resolves when the event is handled
   */
  handle(message: IKafkaEventMessage): Promise<void>;

  /**
   * Handle a batch of Kafka event messages
   * @param messages Array of event messages to handle
   * @returns Promise that resolves when all events are handled
   */
  handleBatch?(messages: IKafkaEventMessage[]): Promise<void>;

  /**
   * Handle an error that occurred during event processing
   * @param error The error that occurred
   * @param message The event message that caused the error
   * @returns Promise that resolves when the error is handled
   */
  handleError?(error: Error, message: IKafkaEventMessage): Promise<void>;
}

/**
 * Kafka service interface
 * Defines the contract for the main Kafka service
 */
export interface IKafkaService {
  /**
   * Connect to the Kafka broker
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the Kafka broker
   * @returns Promise that resolves when disconnected
   */
  disconnect(): Promise<void>;

  /**
   * Get a producer instance
   * @returns The Kafka producer
   */
  getProducer(): IKafkaProducer;

  /**
   * Get a consumer instance
   * @param groupId Optional consumer group ID
   * @returns The Kafka consumer
   */
  getConsumer(groupId?: string): IKafkaConsumer;

  /**
   * Check if the service is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean;

  /**
   * Get the current configuration
   * @returns The current Kafka configuration
   */
  getConfig(): IKafkaConfig;
}

/**
 * Kafka module options interface
 * Used for configuring the Kafka module
 */
export interface IKafkaModuleOptions {
  /**
   * Kafka configuration
   */
  config: IKafkaConfig;

  /**
   * Whether to register the module globally
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Whether to connect on application bootstrap
   * @default true
   */
  connectOnBootstrap?: boolean;

  /**
   * Whether to disconnect on application shutdown
   * @default true
   */
  disconnectOnShutdown?: boolean;
}

/**
 * Kafka module async options interface
 * Used for asynchronous configuration of the Kafka module
 */
export interface IKafkaModuleAsyncOptions {
  /**
   * Dependency injection imports
   */
  imports?: any[];

  /**
   * Whether to register the module globally
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Factory function to create module options
   */
  useFactory: (...args: any[]) => Promise<IKafkaModuleOptions> | IKafkaModuleOptions;

  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];
}

/**
 * Kafka dead letter queue interface
 * Defines the contract for handling failed messages
 */
export interface IKafkaDeadLetterQueue {
  /**
   * Send a message to the dead letter queue
   * @param message The failed message
   * @param error The error that caused the failure
   * @param retryCount Number of retry attempts made
   * @returns Promise that resolves when the message is sent to DLQ
   */
  sendToDLQ<T = any>(message: IKafkaMessage<T>, error: Error, retryCount: number): Promise<void>;

  /**
   * Retrieve messages from the dead letter queue
   * @param topic The original topic
   * @param limit Maximum number of messages to retrieve
   * @returns Promise that resolves with the retrieved messages
   */
  retrieveFromDLQ<T = any>(topic: string, limit?: number): Promise<IKafkaMessage<T>[]>;

  /**
   * Retry processing a message from the dead letter queue
   * @param message The message to retry
   * @returns Promise that resolves when the message is reprocessed
   */
  retryMessage<T = any>(message: IKafkaMessage<T>): Promise<void>;

  /**
   * Retry all messages in the dead letter queue for a topic
   * @param topic The original topic
   * @returns Promise that resolves when all messages are reprocessed
   */
  retryAllMessages(topic: string): Promise<void>;
}

/**
 * Kafka health check interface
 * Defines the contract for Kafka health monitoring
 */
export interface IKafkaHealthCheck {
  /**
   * Check if Kafka is healthy
   * @returns Promise that resolves with the health status
   */
  check(): Promise<IKafkaHealthStatus>;

  /**
   * Get detailed health metrics
   * @returns Promise that resolves with detailed health metrics
   */
  getMetrics(): Promise<IKafkaHealthMetrics>;
}

/**
 * Kafka health status interface
 */
export interface IKafkaHealthStatus {
  /**
   * Whether Kafka is healthy
   */
  isHealthy: boolean;

  /**
   * Status message
   */
  message?: string;

  /**
   * Error if unhealthy
   */
  error?: Error;

  /**
   * Timestamp of the health check
   */
  timestamp: string;
}

/**
 * Kafka health metrics interface
 */
export interface IKafkaHealthMetrics {
  /**
   * Connection status
   */
  connection: {
    /**
     * Whether connected to Kafka
     */
    connected: boolean;

    /**
     * Connection uptime in milliseconds
     */
    uptime?: number;
  };

  /**
   * Producer metrics
   */
  producer?: {
    /**
     * Number of messages sent
     */
    messagesSent: number;

    /**
     * Number of messages failed
     */
    messagesFailed: number;

    /**
     * Average send time in milliseconds
     */
    avgSendTimeMs: number;
  };

  /**
   * Consumer metrics
   */
  consumer?: {
    /**
     * Number of messages received
     */
    messagesReceived: number;

    /**
     * Number of messages processed
     */
    messagesProcessed: number;

    /**
     * Number of messages failed
     */
    messagesFailed: number;

    /**
     * Average processing time in milliseconds
     */
    avgProcessingTimeMs: number;

    /**
     * Consumer lag by topic-partition
     */
    lag: {
      /**
       * Topic name
       */
      topic: string;

      /**
       * Partition number
       */
      partition: number;

      /**
       * Current offset
       */
      currentOffset: string;

      /**
       * Latest offset
       */
      latestOffset: string;

      /**
       * Lag in messages
       */
      lag: number;
    }[];
  };

  /**
   * Dead letter queue metrics
   */
  dlq?: {
    /**
     * Number of messages in DLQ by topic
     */
    messagesByTopic: {
      /**
       * Topic name
       */
      topic: string;

      /**
       * Number of messages
       */
      count: number;
    }[];

    /**
     * Total number of messages in DLQ
     */
    totalMessages: number;
  };
}
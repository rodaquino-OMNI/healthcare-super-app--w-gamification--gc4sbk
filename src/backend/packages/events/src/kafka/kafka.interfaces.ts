/**
 * @file kafka.interfaces.ts
 * @description Defines interfaces for Kafka operations, including consumer, producer, message handler, and configuration interfaces.
 * These interfaces provide contracts for implementation and enable dependency injection with proper typing.
 */

import { ModuleMetadata, Type } from '@nestjs/common';
import { ConsumerConfig, KafkaConfig, ProducerConfig, Message, RecordMetadata } from 'kafkajs';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IEventResponse } from '../interfaces/event-response.interface';

/**
 * Kafka message handler function type
 * @template T - The type of the message value
 */
export type KafkaMessageHandler<T = any> = (
  value: T,
  topic: string,
  partition: number,
  offset: string,
  timestamp: string,
  headers?: Record<string, any>
) => Promise<void>;

/**
 * Kafka batch message handler function type
 * @template T - The type of the message value
 */
export type KafkaBatchMessageHandler<T = any> = (
  messages: Array<{
    value: T;
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    headers?: Record<string, any>;
  }>
) => Promise<void>;

/**
 * Interface for Kafka consumer configuration
 */
export interface IKafkaConsumerConfig extends ConsumerConfig {
  /**
   * Topics to subscribe to
   */
  topics: string[];
  
  /**
   * Consumer group ID
   */
  groupId: string;
  
  /**
   * Whether to enable auto-commit
   * @default true
   */
  autoCommit?: boolean;
  
  /**
   * Maximum number of retries for failed messages
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Dead letter topic for failed messages
   * @default '{originalTopic}.dead-letter'
   */
  deadLetterTopic?: string | ((originalTopic: string) => string);
  
  /**
   * Whether to enable batch processing
   * @default false
   */
  batchProcessing?: boolean;
  
  /**
   * Maximum batch size when batch processing is enabled
   * @default 100
   */
  maxBatchSize?: number;
  
  /**
   * Batch processing timeout in milliseconds
   * @default 1000
   */
  batchProcessingTimeoutMs?: number;
}

/**
 * Interface for Kafka producer configuration
 */
export interface IKafkaProducerConfig extends ProducerConfig {
  /**
   * Default topic to produce to if not specified in the message
   */
  defaultTopic?: string;
  
  /**
   * Whether to enable idempotent production
   * @default false
   */
  idempotent?: boolean;
  
  /**
   * Maximum number of retries for failed productions
   * @default 5
   */
  maxRetries?: number;
  
  /**
   * Retry backoff strategy
   * @default 'exponential'
   */
  retryBackoffStrategy?: 'linear' | 'exponential';
  
  /**
   * Initial retry delay in milliseconds
   * @default 100
   */
  initialRetryDelayMs?: number;
}

/**
 * Interface for Kafka service configuration
 */
export interface IKafkaConfig extends KafkaConfig {
  /**
   * Client ID for the Kafka client
   */
  clientId: string;
  
  /**
   * Broker list
   */
  brokers: string[];
  
  /**
   * Consumer configuration
   */
  consumer?: IKafkaConsumerConfig;
  
  /**
   * Producer configuration
   */
  producer?: IKafkaProducerConfig;
  
  /**
   * Whether to enable SSL
   * @default false
   */
  ssl?: boolean;
  
  /**
   * SSL configuration
   */
  sslOptions?: {
    rejectUnauthorized?: boolean;
    ca?: string[];
    key?: string;
    cert?: string;
  };
  
  /**
   * SASL authentication configuration
   */
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

/**
 * Interface for Kafka module async options
 */
export interface IKafkaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Dependency injection token
   * @default 'KAFKA_MODULE_OPTIONS'
   */
  useExisting?: Type<IKafkaModuleOptionsFactory>;
  
  /**
   * Factory class for creating module options
   */
  useClass?: Type<IKafkaModuleOptionsFactory>;
  
  /**
   * Factory function for creating module options
   */
  useFactory?: (...args: any[]) => Promise<IKafkaConfig> | IKafkaConfig;
  
  /**
   * Factory function dependencies
   */
  inject?: any[];
}

/**
 * Interface for Kafka module options factory
 */
export interface IKafkaModuleOptionsFactory {
  /**
   * Creates Kafka module options
   */
  createKafkaModuleOptions(): Promise<IKafkaConfig> | IKafkaConfig;
}

/**
 * Interface for Kafka message
 * @template T - The type of the message value
 */
export interface IKafkaMessage<T = any> {
  /**
   * Topic to produce to
   */
  topic: string;
  
  /**
   * Message value
   */
  value: T;
  
  /**
   * Message key
   */
  key?: string;
  
  /**
   * Message headers
   */
  headers?: Record<string, any>;
  
  /**
   * Message partition
   */
  partition?: number;
  
  /**
   * Message timestamp
   */
  timestamp?: string;
}

/**
 * Interface for Kafka consumer
 */
export interface IKafkaConsumer {
  /**
   * Subscribe to topics
   * @param topics - Topics to subscribe to
   * @param groupId - Consumer group ID
   */
  subscribe(topics: string[], groupId: string): Promise<void>;
  
  /**
   * Consume messages from subscribed topics
   * @param handler - Message handler function
   */
  consume<T = any>(handler: KafkaMessageHandler<T>): Promise<void>;
  
  /**
   * Consume messages in batches from subscribed topics
   * @param handler - Batch message handler function
   */
  consumeBatch<T = any>(handler: KafkaBatchMessageHandler<T>): Promise<void>;
  
  /**
   * Commit offsets for consumed messages
   * @param topic - Topic name
   * @param partition - Partition number
   * @param offset - Offset to commit
   */
  commit(topic: string, partition: number, offset: string): Promise<void>;
  
  /**
   * Pause consumption from specific topics/partitions
   * @param topicPartitions - Topics and partitions to pause
   */
  pause(topicPartitions: Array<{ topic: string; partition?: number }>): void;
  
  /**
   * Resume consumption from paused topics/partitions
   * @param topicPartitions - Topics and partitions to resume
   */
  resume(topicPartitions: Array<{ topic: string; partition?: number }>): void;
  
  /**
   * Disconnect the consumer
   */
  disconnect(): Promise<void>;
}

/**
 * Interface for Kafka producer
 */
export interface IKafkaProducer {
  /**
   * Connect the producer
   */
  connect(): Promise<void>;
  
  /**
   * Produce a message to a topic
   * @param message - Message to produce
   */
  produce<T = any>(message: IKafkaMessage<T>): Promise<RecordMetadata>;
  
  /**
   * Produce multiple messages to topics
   * @param messages - Messages to produce
   */
  produceMany<T = any>(messages: IKafkaMessage<T>[]): Promise<RecordMetadata[]>;
  
  /**
   * Produce an event to a topic
   * @param event - Event to produce
   * @param topic - Topic to produce to
   * @param key - Optional message key
   * @param headers - Optional message headers
   */
  produceEvent<T extends IBaseEvent = IBaseEvent>(
    event: T,
    topic: string,
    key?: string,
    headers?: Record<string, any>
  ): Promise<RecordMetadata>;
  
  /**
   * Disconnect the producer
   */
  disconnect(): Promise<void>;
}

/**
 * Interface for Kafka service
 */
export interface IKafkaService {
  /**
   * Get the Kafka consumer
   */
  getConsumer(): IKafkaConsumer;
  
  /**
   * Get the Kafka producer
   */
  getProducer(): IKafkaProducer;
  
  /**
   * Connect to Kafka
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from Kafka
   */
  disconnect(): Promise<void>;
}

/**
 * Interface for Kafka event handler
 * @template T - The type of the event
 */
export interface IKafkaEventHandler<T extends IBaseEvent = IBaseEvent> {
  /**
   * Handle an event
   * @param event - Event to handle
   * @param topic - Topic the event was consumed from
   * @param partition - Partition the event was consumed from
   * @param offset - Offset of the event
   * @param headers - Message headers
   */
  handle(
    event: T,
    topic: string,
    partition: number,
    offset: string,
    headers?: Record<string, any>
  ): Promise<IEventResponse>;
  
  /**
   * Check if this handler can handle the given event
   * @param event - Event to check
   */
  canHandle(event: T): boolean;
  
  /**
   * Get the event types this handler can handle
   */
  getEventTypes(): string[];
}

/**
 * Interface for Kafka event processor
 */
export interface IKafkaEventProcessor {
  /**
   * Process an event
   * @param event - Event to process
   * @param topic - Topic the event was consumed from
   * @param partition - Partition the event was consumed from
   * @param offset - Offset of the event
   * @param headers - Message headers
   */
  processEvent<T extends IBaseEvent = IBaseEvent>(
    event: T,
    topic: string,
    partition: number,
    offset: string,
    headers?: Record<string, any>
  ): Promise<IEventResponse>;
  
  /**
   * Register an event handler
   * @param handler - Event handler to register
   */
  registerHandler<T extends IBaseEvent = IBaseEvent>(handler: IKafkaEventHandler<T>): void;
  
  /**
   * Get all registered event handlers
   */
  getHandlers(): IKafkaEventHandler[];
}

/**
 * Interface for Kafka health check
 */
export interface IKafkaHealthCheck {
  /**
   * Check if Kafka is healthy
   */
  check(): Promise<boolean>;
  
  /**
   * Get detailed health status
   */
  getStatus(): Promise<{
    connected: boolean;
    brokers: {
      id: number;
      host: string;
      port: number;
      connected: boolean;
    }[];
    consumer: {
      connected: boolean;
      subscribed: boolean;
      topics: string[];
    };
    producer: {
      connected: boolean;
    };
  }>;
}

/**
 * Interface for Kafka admin operations
 */
export interface IKafkaAdmin {
  /**
   * Create topics
   * @param topics - Topics to create
   */
  createTopics(topics: Array<{ topic: string; numPartitions?: number; replicationFactor?: number }>): Promise<void>;
  
  /**
   * Delete topics
   * @param topics - Topics to delete
   */
  deleteTopics(topics: string[]): Promise<void>;
  
  /**
   * List topics
   */
  listTopics(): Promise<string[]>;
  
  /**
   * Get topic metadata
   * @param topics - Topics to get metadata for
   */
  fetchTopicMetadata(topics?: string[]): Promise<{
    topics: Array<{
      name: string;
      partitions: Array<{
        partitionId: number;
        leader: number;
        replicas: number[];
        isr: number[];
      }>;
    }>;
  }>;
}

/**
 * Interface for Kafka metrics
 */
export interface IKafkaMetrics {
  /**
   * Get consumer metrics
   */
  getConsumerMetrics(): Promise<{
    messagesConsumed: number;
    messagesProcessed: number;
    processingErrors: number;
    commitErrors: number;
    avgProcessingTimeMs: number;
    topicMetrics: Record<string, {
      messagesConsumed: number;
      messagesProcessed: number;
      processingErrors: number;
      avgProcessingTimeMs: number;
    }>;
  }>;
  
  /**
   * Get producer metrics
   */
  getProducerMetrics(): Promise<{
    messagesProduced: number;
    productionErrors: number;
    avgProductionTimeMs: number;
    topicMetrics: Record<string, {
      messagesProduced: number;
      productionErrors: number;
      avgProductionTimeMs: number;
    }>;
  }>;
  
  /**
   * Reset metrics
   */
  resetMetrics(): void;
}
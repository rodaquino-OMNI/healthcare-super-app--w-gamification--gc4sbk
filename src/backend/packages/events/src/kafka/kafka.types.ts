/**
 * @file kafka.types.ts
 * @description TypeScript type definitions for Kafka operations, including event types, message formats,
 * configuration options, and callback signatures. This type system ensures type safety across all Kafka
 * operations in the application.
 */

import { KafkaConfig as KafkaJsConfig, Message as KafkaJsMessage, Consumer, Producer, Admin } from 'kafkajs';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import { ValidationResult } from '../interfaces/event-validation.interface';
import { IEventResponse } from '../interfaces/event-response.interface';

// ===================================================
// Basic Kafka Message Types
// ===================================================

/**
 * Represents the headers in a Kafka message.
 * Headers provide metadata about the message and are used for routing, versioning, and tracing.
 */
export type KafkaHeaders = Record<string, string | Buffer>;

/**
 * Represents a Kafka message with strongly typed payload.
 * Extends the KafkaJS Message type with generic payload typing.
 */
export interface KafkaMessage<T = unknown> extends Omit<KafkaJsMessage, 'value'> {
  /** The topic this message belongs to */
  topic?: string;
  /** The partition this message belongs to */
  partition?: number;
  /** The message key */
  key?: Buffer | string | null;
  /** The message value */
  value: T | Buffer | string | null;
  /** The message headers */
  headers?: KafkaHeaders;
  /** The message timestamp */
  timestamp?: string;
  /** The message offset in the partition */
  offset?: string;
}

/**
 * Represents a Kafka message with a strongly typed event payload.
 * This is a specialized version of KafkaMessage for application events.
 */
export interface KafkaEventMessage<T extends IBaseEvent = IBaseEvent> extends KafkaMessage<T> {
  /** The message value as a strongly typed event */
  value: T | Buffer | string | null;
}

/**
 * Represents a Kafka message with a versioned event payload.
 * This is used for events that support schema versioning.
 */
export interface KafkaVersionedEventMessage<T extends IVersionedEvent = IVersionedEvent> extends KafkaEventMessage<T> {
  /** The message value as a strongly typed versioned event */
  value: T | Buffer | string | null;
}

// ===================================================
// Producer Types
// ===================================================

/**
 * Configuration options for the Kafka producer.
 * Extends the KafkaJS ProducerConfig with additional application-specific options.
 */
export interface KafkaProducerConfig {
  /** The client ID to use for the producer */
  clientId?: string;
  /** The Kafka broker configuration */
  brokers: string[];
  /** Whether to create topics that don't exist */
  allowAutoTopicCreation?: boolean;
  /** The maximum time to wait for a response in ms */
  requestTimeout?: number;
  /** The number of retries for transient errors */
  retry?: KafkaRetryConfig;
  /** The compression type to use */
  compression?: 'gzip' | 'snappy' | 'lz4' | 'none';
  /** The maximum batch size in bytes */
  maxBatchSize?: number;
  /** Whether to use idempotent production */
  idempotent?: boolean;
  /** The transaction ID to use for transactional messages */
  transactionalId?: string;
  /** Additional KafkaJS configuration options */
  kafkaJsConfig?: Partial<KafkaJsConfig>;
}

/**
 * Configuration for retry behavior in Kafka operations.
 */
export interface KafkaRetryConfig {
  /** The maximum number of retries */
  maxRetries: number;
  /** The initial retry delay in ms */
  initialRetryTime: number;
  /** The factor to multiply the retry time by for each retry */
  retryFactor: number;
  /** The maximum retry time in ms */
  maxRetryTime?: number;
  /** Whether to retry on specific error types */
  retryableErrors?: string[];
}

/**
 * Options for producing a message to Kafka.
 */
export interface KafkaProducerSendOptions {
  /** The topic to send the message to */
  topic: string;
  /** The partition to send the message to (optional) */
  partition?: number;
  /** Whether to wait for acknowledgment from all replicas */
  acks?: number;
  /** The timeout for the operation in ms */
  timeout?: number;
  /** The compression type to use */
  compression?: 'gzip' | 'snappy' | 'lz4' | 'none';
  /** Headers to include with the message */
  headers?: KafkaHeaders;
}

/**
 * Represents a record to be sent to Kafka.
 * This is a more strongly typed version of the KafkaJS ProducerRecord.
 */
export interface KafkaProducerRecord<T = unknown> {
  /** The topic to send the message to */
  topic: string;
  /** The messages to send */
  messages: Array<{
    /** The message key */
    key?: string | Buffer | null;
    /** The message value */
    value: T | string | Buffer | null;
    /** The message partition */
    partition?: number;
    /** The message headers */
    headers?: KafkaHeaders;
    /** The message timestamp */
    timestamp?: string;
  }>;
  /** The number of acknowledgments required */
  acks?: number;
  /** The timeout for the operation in ms */
  timeout?: number;
  /** The compression type to use */
  compression?: 'gzip' | 'snappy' | 'lz4' | 'none';
}

/**
 * Represents a record to be sent to Kafka with a strongly typed event payload.
 */
export interface KafkaEventProducerRecord<T extends IBaseEvent = IBaseEvent> extends Omit<KafkaProducerRecord<T>, 'messages'> {
  /** The messages to send with strongly typed event payloads */
  messages: Array<{
    /** The message key */
    key?: string | Buffer | null;
    /** The message value as a strongly typed event */
    value: T | string | Buffer | null;
    /** The message partition */
    partition?: number;
    /** The message headers */
    headers?: KafkaHeaders;
    /** The message timestamp */
    timestamp?: string;
  }>;
}

/**
 * Result of a Kafka producer send operation.
 */
export interface KafkaProducerResult {
  /** The topic the message was sent to */
  topic: string;
  /** The partition the message was sent to */
  partition: number;
  /** The offset of the message in the partition */
  offset: string;
  /** The timestamp of the message */
  timestamp: string;
  /** The base offset of the message batch */
  baseOffset?: string;
  /** The log append time of the message */
  logAppendTime?: string;
  /** The log start offset of the message */
  logStartOffset?: string;
}

// ===================================================
// Consumer Types
// ===================================================

/**
 * Configuration options for the Kafka consumer.
 * Extends the KafkaJS ConsumerConfig with additional application-specific options.
 */
export interface KafkaConsumerConfig {
  /** The client ID to use for the consumer */
  clientId?: string;
  /** The Kafka broker configuration */
  brokers: string[];
  /** The consumer group ID */
  groupId: string;
  /** The maximum time to wait for a response in ms */
  requestTimeout?: number;
  /** The number of retries for transient errors */
  retry?: KafkaRetryConfig;
  /** The maximum number of messages to process in parallel */
  maxParallelMessages?: number;
  /** Whether to commit offsets automatically */
  autoCommit?: boolean;
  /** The auto commit interval in ms */
  autoCommitInterval?: number;
  /** The maximum number of bytes to fetch in a single request */
  maxBytesPerPartition?: number;
  /** The minimum number of bytes to fetch in a single request */
  minBytes?: number;
  /** The maximum number of bytes to fetch in a single request */
  maxBytes?: number;
  /** The maximum wait time for a fetch request in ms */
  maxWaitTimeInMs?: number;
  /** The isolation level for fetching messages */
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED';
  /** Whether to read messages from the beginning of the topic */
  fromBeginning?: boolean;
  /** The partition assignment strategy to use */
  partitionAssigners?: string[];
  /** The session timeout in ms */
  sessionTimeout?: number;
  /** The rebalance timeout in ms */
  rebalanceTimeout?: number;
  /** The heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Whether to allow auto topic creation */
  allowAutoTopicCreation?: boolean;
  /** The maximum number of attempts to process a message before sending to DLQ */
  maxAttempts?: number;
  /** Dead letter queue configuration */
  deadLetterQueue?: KafkaDeadLetterQueueConfig;
  /** Additional KafkaJS configuration options */
  kafkaJsConfig?: Partial<KafkaJsConfig>;
}

/**
 * Configuration for the dead letter queue (DLQ).
 */
export interface KafkaDeadLetterQueueConfig {
  /** Whether to enable the dead letter queue */
  enabled: boolean;
  /** The topic to send dead letter messages to */
  topic: string;
  /** The maximum number of attempts before sending to DLQ */
  maxAttempts: number;
  /** Whether to include the original message in the DLQ message */
  includeOriginalMessage: boolean;
  /** Whether to include the error details in the DLQ message */
  includeErrorDetails: boolean;
}

/**
 * Options for subscribing to Kafka topics.
 */
export interface KafkaConsumerSubscribeOptions {
  /** The topics to subscribe to */
  topics: string[];
  /** Whether to read messages from the beginning of the topic */
  fromBeginning?: boolean;
}

/**
 * Options for committing offsets to Kafka.
 */
export interface KafkaConsumerCommitOptions {
  /** The topics and partitions to commit */
  topics: Array<{
    /** The topic to commit */
    topic: string;
    /** The partitions to commit */
    partitions: Array<{
      /** The partition to commit */
      partition: number;
      /** The offset to commit */
      offset: string;
    }>;
  }>;
}

/**
 * Callback function for processing Kafka messages.
 */
export type KafkaMessageHandler<T = unknown> = (
  message: KafkaMessage<T>,
  topic: string,
  partition: number,
) => Promise<void> | void;

/**
 * Callback function for processing Kafka events.
 */
export type KafkaEventHandler<T extends IBaseEvent = IBaseEvent> = (
  event: T,
  message: KafkaEventMessage<T>,
  topic: string,
  partition: number,
) => Promise<IEventResponse> | IEventResponse;

/**
 * Callback function for batch processing Kafka messages.
 */
export type KafkaBatchMessageHandler<T = unknown> = (
  messages: KafkaMessage<T>[],
  topic: string,
  partition: number,
) => Promise<void> | void;

/**
 * Callback function for batch processing Kafka events.
 */
export type KafkaBatchEventHandler<T extends IBaseEvent = IBaseEvent> = (
  events: T[],
  messages: KafkaEventMessage<T>[],
  topic: string,
  partition: number,
) => Promise<IEventResponse[]> | IEventResponse[];

// ===================================================
// Admin Types
// ===================================================

/**
 * Configuration options for the Kafka admin client.
 */
export interface KafkaAdminConfig {
  /** The client ID to use for the admin client */
  clientId?: string;
  /** The Kafka broker configuration */
  brokers: string[];
  /** The maximum time to wait for a response in ms */
  requestTimeout?: number;
  /** The number of retries for transient errors */
  retry?: KafkaRetryConfig;
  /** Additional KafkaJS configuration options */
  kafkaJsConfig?: Partial<KafkaJsConfig>;
}

/**
 * Options for creating a Kafka topic.
 */
export interface KafkaTopicConfig {
  /** The topic name */
  topic: string;
  /** The number of partitions */
  numPartitions?: number;
  /** The replication factor */
  replicationFactor?: number;
  /** The topic configuration */
  configEntries?: Array<{
    /** The configuration name */
    name: string;
    /** The configuration value */
    value: string;
  }>;
}

// ===================================================
// Error Handling Types
// ===================================================

/**
 * Represents an error that occurred during a Kafka operation.
 */
export interface KafkaError extends Error {
  /** The error type */
  type: string;
  /** The error code */
  code?: string;
  /** The original error that caused this error */
  cause?: Error;
  /** Whether this error is retriable */
  retriable?: boolean;
  /** The broker that reported this error */
  broker?: string;
  /** The topic that was being accessed when the error occurred */
  topic?: string;
  /** The partition that was being accessed when the error occurred */
  partition?: number;
}

/**
 * Represents a message that failed processing and is being sent to the dead letter queue.
 */
export interface KafkaDeadLetterQueueMessage<T = unknown> {
  /** The original message that failed processing */
  originalMessage: KafkaMessage<T>;
  /** The error that caused the message to be sent to the DLQ */
  error: {
    /** The error message */
    message: string;
    /** The error name */
    name: string;
    /** The error stack trace */
    stack?: string;
    /** The error code */
    code?: string;
    /** Additional error details */
    details?: Record<string, unknown>;
  };
  /** The number of attempts that were made to process the message */
  attempts: number;
  /** The timestamp when the message was sent to the DLQ */
  timestamp: string;
  /** The consumer group that was processing the message */
  consumerGroup: string;
  /** Additional metadata about the failure */
  metadata?: Record<string, unknown>;
}

// ===================================================
// Validation Types
// ===================================================

/**
 * Options for validating Kafka messages.
 */
export interface KafkaValidationOptions {
  /** Whether to validate the message structure */
  validateStructure?: boolean;
  /** Whether to validate the message headers */
  validateHeaders?: boolean;
  /** Whether to validate the message payload */
  validatePayload?: boolean;
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Required headers that must be present */
  requiredHeaders?: string[];
  /** Schema to validate the payload against */
  schema?: unknown;
  /** Custom validation function */
  customValidator?: (message: KafkaMessage) => ValidationResult;
}

/**
 * Result of a Kafka message validation operation.
 */
export interface KafkaValidationResult extends ValidationResult {
  /** The original message that was validated */
  message: KafkaMessage;
  /** Whether the structure validation passed */
  structureValid?: boolean;
  /** Whether the headers validation passed */
  headersValid?: boolean;
  /** Whether the payload validation passed */
  payloadValid?: boolean;
}

// ===================================================
// Utility Types
// ===================================================

/**
 * Utility type for extracting the payload type from a KafkaMessage.
 */
export type KafkaMessagePayload<T> = T extends KafkaMessage<infer P> ? P : never;

/**
 * Utility type for converting a plain object to a Kafka message.
 */
export type ToKafkaMessage<T> = Omit<KafkaMessage<T>, 'value'> & {
  value: T;
};

/**
 * Utility type for converting a Kafka message to a plain object.
 */
export type FromKafkaMessage<T> = T extends KafkaMessage<infer P> ? P : never;

/**
 * Utility type for creating a strongly typed Kafka client.
 */
export interface KafkaClient {
  /** The KafkaJS consumer instance */
  consumer: Consumer;
  /** The KafkaJS producer instance */
  producer: Producer;
  /** The KafkaJS admin instance */
  admin: Admin;
  /** The client ID */
  clientId: string;
  /** The broker list */
  brokers: string[];
  /** Whether the client is connected */
  isConnected: boolean;
  /** Connect to Kafka */
  connect(): Promise<void>;
  /** Disconnect from Kafka */
  disconnect(): Promise<void>;
}

/**
 * Utility type for Kafka health check status.
 */
export interface KafkaHealthStatus {
  /** Whether the Kafka connection is healthy */
  isHealthy: boolean;
  /** The details of the health check */
  details: {
    /** Whether the consumer is connected */
    consumer: boolean;
    /** Whether the producer is connected */
    producer: boolean;
    /** Whether the admin client is connected */
    admin: boolean;
    /** The broker connection status */
    brokers: {
      /** The broker ID */
      id: string;
      /** Whether the broker is connected */
      connected: boolean;
    }[];
  };
  /** The timestamp of the health check */
  timestamp: string;
  /** Any error that occurred during the health check */
  error?: string;
}
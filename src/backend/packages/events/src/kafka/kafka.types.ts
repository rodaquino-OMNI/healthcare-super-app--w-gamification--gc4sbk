/**
 * @file kafka.types.ts
 * @description TypeScript type definitions for Kafka operations, including event types, message formats,
 * configuration options, and callback signatures. This type system ensures type safety across all
 * Kafka operations in the application.
 */

import { Consumer, Producer, KafkaMessage, IHeaders, RecordMetadata, Kafka } from 'kafkajs';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IKafkaEvent } from '../interfaces/kafka-event.interface';
import { EventVersion } from '../interfaces/event-versioning.interface';
import { ValidationResult } from '../interfaces/event-validation.interface';

/**
 * Represents the possible journey sources for events
 */
export enum EventJourney {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  SYSTEM = 'system',
}

/**
 * Represents the possible event processing statuses
 */
export enum EventProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  DEAD_LETTERED = 'dead_lettered',
}

/**
 * Represents the possible error types for Kafka operations
 */
export enum KafkaErrorType {
  CONNECTION = 'connection_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  BROKER = 'broker_error',
  TIMEOUT = 'timeout_error',
  SERIALIZATION = 'serialization_error',
  VALIDATION = 'validation_error',
  PROCESSING = 'processing_error',
  UNKNOWN = 'unknown_error',
}

/**
 * Represents the retry policy for failed Kafka operations
 */
export enum RetryPolicy {
  NONE = 'none',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  CUSTOM = 'custom',
}

/**
 * Represents the Kafka message headers with strongly typed values
 */
export type KafkaHeaders = {
  [key: string]: string | Buffer | null | undefined;
  'event-id'?: string;
  'correlation-id'?: string;
  'trace-id'?: string;
  'user-id'?: string;
  'event-type'?: string;
  'event-version'?: string;
  'event-journey'?: EventJourney;
  'event-source'?: string;
  'event-timestamp'?: string;
  'retry-count'?: string;
  'dead-letter'?: string;
};

/**
 * Represents a Kafka message with strongly typed payload
 */
export interface TypedKafkaMessage<T = unknown> extends Omit<KafkaMessage, 'headers' | 'value'> {
  headers?: KafkaHeaders;
  value: T | null;
  parsedValue?: any; // The deserialized value after processing
  validationResult?: ValidationResult; // Result of validation if performed
}

/**
 * Configuration options for Kafka consumer
 */
export interface KafkaConsumerConfig {
  groupId: string;
  clientId?: string;
  topics: string[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
  autoCommitInterval?: number;
  maxBytesPerPartition?: number;
  minBytes?: number;
  maxBytes?: number;
  maxWaitTimeInMs?: number;
  retry?: KafkaRetryConfig;
  deadLetter?: KafkaDeadLetterConfig;
  validation?: KafkaValidationConfig;
  deserializer?: KafkaDeserializerConfig;
}

/**
 * Configuration options for Kafka producer
 */
export interface KafkaProducerConfig {
  clientId?: string;
  acks?: number;
  timeout?: number;
  compression?: 'none' | 'gzip' | 'snappy' | 'lz4';
  maxRetries?: number;
  retry?: KafkaRetryConfig;
  idempotent?: boolean;
  transactionalId?: string;
  serializer?: KafkaSerializerConfig;
}

/**
 * Configuration for Kafka retry behavior
 */
export interface KafkaRetryConfig {
  enabled: boolean;
  retries?: number;
  initialRetryTimeMs?: number;
  maxRetryTimeMs?: number;
  factor?: number;
  policy?: RetryPolicy;
  retryableErrors?: KafkaErrorType[];
}

/**
 * Configuration for Kafka dead letter handling
 */
export interface KafkaDeadLetterConfig {
  enabled: boolean;
  topic?: string;
  maxRetries?: number;
  headerPrefix?: string;
}

/**
 * Configuration for Kafka message validation
 */
export interface KafkaValidationConfig {
  enabled: boolean;
  strict?: boolean;
  schemaRegistry?: {
    url: string;
    auth?: {
      username: string;
      password: string;
    };
  };
  zod?: boolean;
  classValidator?: boolean;
}

/**
 * Configuration for Kafka message serialization
 */
export interface KafkaSerializerConfig {
  type?: 'json' | 'avro' | 'protobuf' | 'custom';
  encoding?: 'utf8' | 'base64' | 'binary';
  custom?: {
    serialize: (data: any) => Buffer;
  };
}

/**
 * Configuration for Kafka message deserialization
 */
export interface KafkaDeserializerConfig {
  type?: 'json' | 'avro' | 'protobuf' | 'custom';
  encoding?: 'utf8' | 'base64' | 'binary';
  custom?: {
    deserialize: (data: Buffer) => any;
  };
}

/**
 * Represents a Kafka message with a strongly typed payload
 */
export interface KafkaTypedPayload<T> {
  topic: string;
  partition?: number;
  key?: string | Buffer;
  value: T;
  headers?: KafkaHeaders;
  timestamp?: string;
}

/**
 * Represents a batch of Kafka messages with strongly typed payloads
 */
export interface KafkaTypedBatch<T> {
  topic: string;
  messages: KafkaTypedPayload<T>[];
}

/**
 * Represents the result of a Kafka message send operation
 */
export interface KafkaSendResult {
  topicName: string;
  partition: number;
  errorCode: number;
  baseOffset: string;
  logAppendTime?: string;
  logStartOffset?: string;
}

/**
 * Represents a Kafka event with version information
 */
export interface VersionedKafkaEvent<T = unknown> extends IKafkaEvent<T> {
  version: EventVersion;
  isCompatible(requiredVersion: EventVersion): boolean;
  upgradeToVersion(targetVersion: EventVersion): VersionedKafkaEvent<T>;
}

/**
 * Callback function type for Kafka message processing
 */
export type KafkaMessageHandler<T = unknown> = (
  message: TypedKafkaMessage<T>,
  topic: string,
  partition: number
) => Promise<void>;

/**
 * Callback function type for Kafka batch message processing
 */
export type KafkaBatchHandler<T = unknown> = (
  messages: TypedKafkaMessage<T>[],
  topic: string,
  partition: number
) => Promise<void>;

/**
 * Callback function type for Kafka message validation
 */
export type KafkaMessageValidator<T = unknown> = (
  message: TypedKafkaMessage<T>
) => Promise<ValidationResult>;

/**
 * Callback function type for Kafka message transformation
 */
export type KafkaMessageTransformer<T = unknown, R = unknown> = (
  message: TypedKafkaMessage<T>
) => Promise<TypedKafkaMessage<R>>;

/**
 * Callback function type for Kafka error handling
 */
export type KafkaErrorHandler = (
  error: Error,
  topic?: string,
  partition?: number,
  offset?: string
) => Promise<void>;

/**
 * Callback function type for Kafka message serialization
 */
export type KafkaSerializer<T = unknown> = (data: T) => Buffer;

/**
 * Callback function type for Kafka message deserialization
 */
export type KafkaDeserializer<T = unknown> = (data: Buffer) => T;

/**
 * Represents a factory for creating Kafka messages from application events
 */
export interface KafkaMessageFactory {
  createMessage<T>(event: IBaseEvent<T>, options?: {
    key?: string;
    partition?: number;
    headers?: KafkaHeaders;
  }): KafkaTypedPayload<T>;
  
  createBatch<T>(events: IBaseEvent<T>[], topic: string): KafkaTypedBatch<T>;
}

/**
 * Represents a Kafka consumer with strongly typed message handling
 */
export interface TypedKafkaConsumer<T = unknown> extends Consumer {
  subscribe(options: { topics: string[], fromBeginning?: boolean }): Promise<void>;
  run(options: {
    eachMessage?: (payload: {
      topic: string;
      partition: number;
      message: TypedKafkaMessage<T>;
    }) => Promise<void>;
    eachBatch?: (payload: {
      batch: {
        topic: string;
        partition: number;
        messages: TypedKafkaMessage<T>[];
      };
    }) => Promise<void>;
  }): Promise<void>;
}

/**
 * Represents a Kafka producer with strongly typed message sending
 */
export interface TypedKafkaProducer<T = unknown> extends Producer {
  send<K extends T>(record: KafkaTypedBatch<K>): Promise<RecordMetadata[]>;
  sendMessage<K extends T>(message: KafkaTypedPayload<K>): Promise<RecordMetadata[]>;
}

/**
 * Represents a circuit breaker for Kafka operations
 */
export interface KafkaCircuitBreaker {
  isOpen(): boolean;
  isClosed(): boolean;
  isHalfOpen(): boolean;
  open(): void;
  close(): void;
  halfOpen(): void;
  execute<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Represents the health status of a Kafka connection
 */
export interface KafkaHealthStatus {
  isHealthy: boolean;
  details: {
    connected: boolean;
    brokers: {
      id: number;
      host: string;
      port: number;
      connected: boolean;
    }[];
    lastError?: {
      message: string;
      type: KafkaErrorType;
      timestamp: Date;
    };
  };
}

/**
 * Represents the metrics for Kafka operations
 */
export interface KafkaMetrics {
  messagesProduced: number;
  messagesConsumed: number;
  errors: number;
  retries: number;
  deadLetters: number;
  avgProcessingTimeMs: number;
  avgBatchSizeBytes: number;
  lastProcessedTimestamp?: Date;
}

/**
 * Represents a Kafka admin client for topic management
 */
export interface KafkaTopicAdmin {
  createTopics(topics: {
    topic: string;
    numPartitions?: number;
    replicationFactor?: number;
    configEntries?: { name: string; value: string }[];
  }[]): Promise<void>;
  deleteTopics(topics: string[]): Promise<void>;
  listTopics(): Promise<string[]>;
  describeTopics(topics: string[]): Promise<any>;
}

/**
 * Represents a Kafka connection factory
 */
export interface KafkaConnectionFactory {
  createKafkaInstance(config: {
    clientId: string;
    brokers: string[];
    ssl?: boolean;
    sasl?: {
      mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
      username: string;
      password: string;
    };
  }): Kafka;
  
  createConsumer<T>(kafka: Kafka, config: KafkaConsumerConfig): TypedKafkaConsumer<T>;
  createProducer<T>(kafka: Kafka, config: KafkaProducerConfig): TypedKafkaProducer<T>;
  createAdmin(kafka: Kafka): KafkaTopicAdmin;
}
/**
 * @file kafka.types.ts
 * @description Type definitions for Kafka operations in the gamification engine.
 * Provides standardized interfaces for messages, headers, configuration, and callbacks.
 * 
 * This file is part of the AUSTA SuperApp gamification engine and implements the
 * standardized event schema requirements from the technical specification.
 * 
 * @see Technical Specification Section 5.2.1 - Gamification Engine (updated)
 * @see Technical Specification Section 0.2.3 - Phase 4: Gamification Event Architecture
 */

import { Kafka, Consumer, Producer, KafkaMessage, ProducerRecord, RecordMetadata } from 'kafkajs';
import { Logger } from '@nestjs/common';

// Import event interfaces from @austa/interfaces package
import { 
  GamificationEvent, 
  EventType,
  EventPayload,
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload,
  Achievement,
  Quest,
  Reward,
  Rule
} from '@austa/interfaces/gamification';

// Import common interfaces
import { IEventResponse } from '@austa/interfaces/common';

// Import error interfaces
import { IErrorDetails } from '@austa/interfaces/common/errors';

// Import from @austa/events package for integration with the standardized event system
import { IKafkaConfig, IConsumerConfig, IProducerConfig } from '@austa/events/kafka';

/**
 * Kafka message headers with standardized format
 * 
 * These headers provide metadata for message processing, tracing, and error handling.
 * They are used for correlation across services, retry handling, and observability.
 */
export interface KafkaHeaders {
  /** Unique identifier for correlation across services */
  correlationId: string;
  /** Source service that produced the message */
  source: string;
  /** Timestamp when the message was produced */
  timestamp: string;
  /** Message schema version for compatibility */
  schemaVersion: string;
  /** Optional journey context (health, care, plan) */
  journeyContext?: string;
  /** Optional retry count for failed messages */
  retryCount?: string;
  /** Optional original topic for dead-letter messages */
  originalTopic?: string;
  /** Optional trace ID for distributed tracing */
  traceId?: string;
  /** Optional span ID for distributed tracing */
  spanId?: string;
  /** Optional user ID associated with the event */
  userId?: string;
  /** Optional tenant ID for multi-tenant deployments */
  tenantId?: string;
  /** Optional environment identifier (dev, staging, prod) */
  environment?: string;
  /** Optional deployment version */
  deploymentVersion?: string;
  /** Optional priority level (high, medium, low) */
  priority?: string;
  /** Optional expiration timestamp for time-sensitive messages */
  expiresAt?: string;
  /** Allow for additional custom headers */
  [key: string]: string | undefined;
}

/**
 * Kafka message value with typed payload
 * 
 * This interface defines the structure of the message value for Kafka messages
 * in the gamification engine. It follows the standardized event schema defined
 * in the @austa/interfaces package and ensures type safety for event payloads.
 * 
 * @template T - The type of event payload, extending the base EventPayload interface
 */
export interface KafkaMessageValue<T extends EventPayload = EventPayload> {
  /** Unique identifier for the event */
  eventId: string;
  /** Type of event from standardized enum */
  eventType: EventType;
  /** Timestamp of event creation in ISO format */
  timestamp: string;
  /** Source service or component that generated the event */
  source: string;
  /** Schema version for compatibility in semver format */
  version: string;
  /** Typed payload containing event-specific data */
  payload: T;
  /** Optional metadata for additional context */
  metadata?: {
    /** User ID associated with the event */
    userId?: string;
    /** Correlation ID for tracing */
    correlationId?: string;
    /** Journey context (health, care, plan) */
    journeyContext?: string;
    /** Additional custom metadata */
    [key: string]: unknown;
  };
}

/**
 * Typed Kafka message extending KafkaJS message
 * 
 * This interface extends the KafkaMessage interface from KafkaJS with typed
 * value and headers. It provides type safety for message processing in the
 * gamification engine.
 * 
 * @template T - The type of event payload
 */
export interface TypedKafkaMessage<T extends EventPayload = EventPayload> extends Omit<KafkaMessage, 'value'> {
  /** Typed message value */
  value: KafkaMessageValue<T> | null;
  /** Typed headers */
  headers?: KafkaHeaders;
}

/**
 * Kafka message with journey-specific payload types
 * 
 * These type aliases provide specialized message types for each journey,
 * with the appropriate payload type for that journey.
 */

/**
 * Health journey Kafka message with health-specific payload
 * 
 * Used for events like health metric recording, goal achievement,
 * health insight generation, and device synchronization.
 */
export type HealthKafkaMessage = TypedKafkaMessage<HealthEventPayload>;

/**
 * Care journey Kafka message with care-specific payload
 * 
 * Used for events like appointment booking, medication adherence,
 * telemedicine session, and care plan progress.
 */
export type CareKafkaMessage = TypedKafkaMessage<CareEventPayload>;

/**
 * Plan journey Kafka message with plan-specific payload
 * 
 * Used for events like claim submission, benefit utilization,
 * plan selection and comparison, and reward redemption.
 */
export type PlanKafkaMessage = TypedKafkaMessage<PlanEventPayload>;

/**
 * Discriminated union of all journey-specific message types
 * 
 * This type can be used when a function needs to handle messages
 * from any journey, with proper type discrimination based on the
 * eventType or journeyContext.
 */
export type JourneyKafkaMessage = HealthKafkaMessage | CareKafkaMessage | PlanKafkaMessage;

/**
 * Type guard to check if a message is a Health journey message
 * 
 * @param message - The message to check
 * @returns Whether the message is a Health journey message
 */
export function isHealthMessage(message: JourneyKafkaMessage): message is HealthKafkaMessage {
  return message.value?.payload && 'healthMetric' in message.value.payload ||
         message.headers?.journeyContext === 'health';
}

/**
 * Type guard to check if a message is a Care journey message
 * 
 * @param message - The message to check
 * @returns Whether the message is a Care journey message
 */
export function isCareMessage(message: JourneyKafkaMessage): message is CareKafkaMessage {
  return message.value?.payload && 'careProvider' in message.value.payload ||
         message.headers?.journeyContext === 'care';
}

/**
 * Type guard to check if a message is a Plan journey message
 * 
 * @param message - The message to check
 * @returns Whether the message is a Plan journey message
 */
export function isPlanMessage(message: JourneyKafkaMessage): message is PlanKafkaMessage {
  return message.value?.payload && 'planId' in message.value.payload ||
         message.headers?.journeyContext === 'plan';
}

/**
 * Kafka configuration options
 * 
 * This interface defines the configuration options for the Kafka client.
 * It includes broker connection details, authentication, SSL, timeouts,
 * and retry settings. These options are used to initialize the Kafka client
 * in the gamification engine.
 * 
 * This interface extends IKafkaConfig from @austa/events/kafka for compatibility
 * with the standardized event system.
 */
export interface KafkaConfig extends IKafkaConfig {
  /** Kafka client ID for identification */
  clientId: string;
  /** Array of broker addresses in the format host:port */
  brokers: string[];
  /** Authentication configuration for secure clusters */
  sasl?: {
    /** Authentication mechanism */
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    /** Username for authentication */
    username: string;
    /** Password for authentication */
    password: string;
  };
  /** SSL configuration for secure connections */
  ssl?: boolean | {
    /** Whether to reject unauthorized certificates */
    rejectUnauthorized?: boolean;
    /** Certificate authority certificates */
    ca?: string[];
    /** Client key */
    key?: string;
    /** Client certificate */
    cert?: string;
  };
  /** Connection timeout in milliseconds (default: 1000) */
  connectionTimeout?: number;
  /** Request timeout in milliseconds (default: 30000) */
  requestTimeout?: number;
  /** Retry configuration for connection and request failures */
  retry?: {
    /** Initial retry time in milliseconds */
    initialRetryTime: number;
    /** Maximum number of retries */
    retries: number;
    /** Maximum retry time in milliseconds */
    maxRetryTime?: number;
    /** Backoff factor for exponential backoff */
    factor?: number;
    /** Multiplier for retry time calculation */
    multiplier?: number;
  };
  /** Logger instance creator function */
  logCreator?: (logger: Logger) => any;
  /** Optional metadata configuration */
  metadata?: {
    /** Metadata refresh interval in milliseconds */
    refreshInterval?: number;
    /** Timeout for metadata requests in milliseconds */
    timeout?: number;
  };
  /** Optional transaction configuration */
  transactions?: {
    /** Transaction timeout in milliseconds */
    timeout?: number;
  };
}

/**
 * Consumer configuration options
 * 
 * This interface defines the configuration options for Kafka consumers in the
 * gamification engine. It includes consumer group settings, topic subscriptions,
 * processing options, dead letter queue configuration, and retry settings.
 * 
 * The configuration supports the enhanced event processing pipeline with
 * dead-letter queues and exponential backoff retry strategies as specified
 * in the technical specification.
 * 
 * This interface extends IConsumerConfig from @austa/events/kafka for compatibility
 * with the standardized event system.
 * 
 * @see Technical Specification Section 5.2.1 - Gamification Engine (updated)
 */
export interface ConsumerConfig extends IConsumerConfig {
  /** Consumer group ID for this consumer instance */
  groupId: string;
  /** Topics to subscribe to */
  topics: string[];
  /** Consumer options for fine-tuning behavior */
  options?: {
    /** Whether to auto-commit offsets (default: true) */
    autoCommit?: boolean;
    /** Auto-commit interval in milliseconds (default: 5000) */
    autoCommitInterval?: number;
    /** Session timeout in milliseconds (default: 30000) */
    sessionTimeout?: number;
    /** Heartbeat interval in milliseconds (default: 3000) */
    heartbeatInterval?: number;
    /** Maximum number of bytes to fetch (default: 1048576) */
    maxBytes?: number;
    /** Maximum wait time in milliseconds (default: 5000) */
    maxWaitTimeInMs?: number;
    /** Minimum number of bytes to fetch (default: 1) */
    minBytes?: number;
    /** Maximum number of batches to process (default: 1000) */
    maxBatchSize?: number;
    /** Whether to allow auto-topic creation (default: false) */
    allowAutoTopicCreation?: boolean;
    /** Starting offset (earliest or latest, default: earliest) */
    fromBeginning?: boolean;
    /** Partition assignment strategy */
    partitionAssigners?: string[];
  };
  /** Dead letter queue configuration for handling failed messages */
  deadLetterQueue?: {
    /** Topic for dead letter messages */
    topic: string;
    /** Maximum retry attempts before sending to DLQ (default: 5) */
    maxRetries: number;
    /** Whether to include the original message in the DLQ message */
    includeOriginalMessage?: boolean;
    /** Whether to include the error details in the DLQ message */
    includeErrorDetails?: boolean;
    /** Headers to include in the DLQ message */
    headers?: string[];
  };
  /** Retry configuration for failed message processing */
  retry?: {
    /** Initial retry delay in milliseconds (default: 1000) */
    initialRetryTime: number;
    /** Maximum retry attempts (default: 5) */
    retries: number;
    /** Maximum retry time in milliseconds (default: 30000) */
    maxRetryTime?: number;
    /** Backoff factor for exponential backoff (default: 2) */
    factor?: number;
    /** Whether to use jitter to prevent thundering herd (default: true) */
    jitter?: boolean;
  };
  /** Error handling configuration */
  errorHandling?: {
    /** Whether to continue processing on error (default: true) */
    continueOnError?: boolean;
    /** Error types that should be retried */
    retriableErrors?: string[];
    /** Error types that should not be retried */
    nonRetriableErrors?: string[];
  };
  /** Validation configuration */
  validation?: {
    /** Whether to validate messages against schema (default: true) */
    enabled?: boolean;
    /** Whether to skip invalid messages (default: false) */
    skipInvalid?: boolean;
  };
}

/**
 * Producer configuration options
 * 
 * This interface defines the configuration options for Kafka producers in the
 * gamification engine. It includes topic mappings, producer options, and retry settings.
 * 
 * The configuration supports the standardized event schema with journey-specific topics
 * and reliable message delivery with retry mechanisms as specified in the technical specification.
 * 
 * This interface extends IProducerConfig from @austa/events/kafka for compatibility
 * with the standardized event system.
 * 
 * @see Technical Specification Section 5.2.1 - Gamification Engine (updated)
 * @see Technical Specification Section 0.2.3 - Phase 4: Gamification Event Architecture
 */
export interface ProducerConfig extends IProducerConfig {
  /** Topics configuration mapping logical names to physical Kafka topics */
  topics: {
    /** Default topic for messages */
    default: string;
    /** Dead letter queue topic for failed messages */
    deadLetter?: string;
    /** Health journey topic for health-related events */
    health?: string;
    /** Care journey topic for care-related events */
    care?: string;
    /** Plan journey topic for plan-related events */
    plan?: string;
    /** Retry topic for messages that need to be retried */
    retry?: string;
    /** Achievement topic for achievement-related events */
    achievements?: string;
    /** Quest topic for quest-related events */
    quests?: string;
    /** Reward topic for reward-related events */
    rewards?: string;
    /** Leaderboard topic for leaderboard-related events */
    leaderboards?: string;
    /** Notification topic for sending notifications */
    notifications?: string;
    /** Allow for additional custom topics */
    [key: string]: string | undefined;
  };
  /** Producer options for fine-tuning behavior */
  options?: {
    /** 
     * Acknowledgment level:
     * 0 = no acknowledgment
     * 1 = leader acknowledgment
     * -1 = all replicas acknowledgment
     * (default: -1)
     */
    acks?: number;
    /** Timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Compression type (default: 'none') */
    compression?: 'none' | 'gzip' | 'snappy' | 'lz4';
    /** Maximum in-flight requests (default: 5) */
    maxInFlightRequests?: number;
    /** Whether to use idempotent production (default: true) */
    idempotent?: boolean;
    /** Transaction ID for transactional messages */
    transactionalId?: string;
    /** Batch size in bytes (default: 16384) */
    batchSize?: number;
    /** Batch compression threshold in bytes */
    compressionThreshold?: number;
    /** Linger time in milliseconds (default: 5) */
    linger?: number;
  };
  /** Retry configuration for failed message production */
  retry?: {
    /** Initial retry delay in milliseconds (default: 100) */
    initialRetryTime: number;
    /** Maximum retry attempts (default: 8) */
    retries: number;
    /** Maximum retry time in milliseconds (default: 30000) */
    maxRetryTime?: number;
    /** Backoff factor for exponential backoff (default: 2) */
    factor?: number;
    /** Whether to use jitter to prevent thundering herd (default: true) */
    jitter?: boolean;
  };
  /** Headers to include in all produced messages */
  defaultHeaders?: {
    /** Source service identifier */
    source?: string;
    /** Environment identifier (dev, staging, prod) */
    environment?: string;
    /** Additional custom headers */
    [key: string]: string | undefined;
  };
  /** Schema validation configuration */
  schemaValidation?: {
    /** Whether to validate messages against schema before sending (default: true) */
    enabled?: boolean;
    /** Whether to throw error on validation failure (default: true) */
    failOnError?: boolean;
  };
}

/**
 * Message processing result
 * 
 * This interface defines the structure of the result returned by message handlers
 * after processing a Kafka message. It includes success/failure status, error details,
 * retry information, and metadata about the processing outcome.
 * 
 * The result is used to determine whether to commit the message offset, retry the
 * message, or send it to the dead letter queue.
 * 
 * It implements the IEventResponse interface from @austa/interfaces/common for
 * consistency with other event processing components.
 */
export interface MessageProcessingResult extends IEventResponse {
  /** Whether processing was successful */
  success: boolean;
  /** Error message if processing failed */
  error?: string;
  /** Error code if processing failed */
  errorCode?: string;
  /** Whether to retry processing */
  retry?: boolean;
  /** Detailed error information */
  errorDetails?: IErrorDetails;
  /** Metadata for additional context */
  metadata?: {
    /** Processing duration in milliseconds */
    processingTime?: number;
    /** Timestamp when processing started */
    processingStartTime?: string;
    /** Timestamp when processing completed */
    processingEndTime?: string;
    /** Number of retry attempts so far */
    retryCount?: number;
    /** ID of the achievement that was processed (if applicable) */
    achievementId?: string;
    /** ID of the quest that was processed (if applicable) */
    questId?: string;
    /** ID of the reward that was processed (if applicable) */
    rewardId?: string;
    /** ID of the rule that was evaluated (if applicable) */
    ruleId?: string;
    /** ID of the user associated with the event */
    userId?: string;
    /** Journey context (health, care, plan) */
    journeyContext?: string;
    /** Additional custom metadata */
    [key: string]: unknown;
  };
  /** Achievement data if an achievement was unlocked */
  achievement?: Achievement;
  /** Quest data if a quest was updated */
  quest?: Quest;
  /** Reward data if a reward was granted */
  reward?: Reward;
  /** Rule data if a rule was triggered */
  rule?: Rule;
  /** Points awarded as a result of processing */
  pointsAwarded?: number;
  /** Level progression as a result of processing */
  levelProgression?: {
    /** Previous level */
    previousLevel: number;
    /** Current level */
    currentLevel: number;
    /** Whether a level up occurred */
    leveledUp: boolean;
  };
}

/**
 * Message handler function signature
 * 
 * Defines the contract for functions that process Kafka messages in the gamification engine.
 * Handlers receive a typed message and optional context, and return a processing result
 * that indicates success/failure and whether to retry.
 * 
 * @template T - The type of event payload
 */
export type MessageHandler<T extends EventPayload = EventPayload> = (
  message: TypedKafkaMessage<T>,
  context?: MessageHandlerContext
) => Promise<MessageProcessingResult>;

/**
 * Context object passed to message handlers
 * 
 * Provides additional context and utilities for message handlers, including
 * access to services, configuration, and helper functions.
 */
export interface MessageHandlerContext {
  /** Logger instance for handler-specific logging */
  logger?: Logger;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Current retry count for this message */
  retryCount?: number;
  /** Original topic if this is a retry */
  originalTopic?: string;
  /** Journey context (health, care, plan) */
  journeyContext?: string;
  /** User ID associated with the event */
  userId?: string;
  /** Timestamp when processing started */
  processingStartTime?: string;
  /** Additional context data */
  [key: string]: any;
}

/**
 * Message transformer function signature
 * 
 * Defines the contract for functions that transform Kafka messages from one type to another.
 * Transformers can modify the message payload, headers, or both.
 * 
 * @template T - The input event payload type
 * @template R - The output event payload type
 */
export type MessageTransformer<T extends EventPayload = EventPayload, R extends EventPayload = T> = (
  message: TypedKafkaMessage<T>
) => TypedKafkaMessage<R> | Promise<TypedKafkaMessage<R>>;

/**
 * Message validator function signature
 * 
 * Defines the contract for functions that validate Kafka messages before processing.
 * Validators return a boolean indicating whether the message is valid.
 * 
 * @template T - The type of event payload
 */
export type MessageValidator<T extends EventPayload = EventPayload> = (
  message: TypedKafkaMessage<T>
) => Promise<boolean> | boolean;

/**
 * Validation result with detailed error information
 * 
 * Provides more detailed validation results than a simple boolean,
 * including error messages and validation context.
 */
export interface ValidationResult {
  /** Whether validation was successful */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Error code if validation failed */
  errorCode?: string;
  /** Path to the invalid field */
  path?: string;
  /** Additional validation context */
  context?: Record<string, unknown>;
  /** Detailed error information */
  errorDetails?: IErrorDetails;
}

/**
 * Enhanced message validator function signature with detailed results
 * 
 * Defines the contract for validators that return detailed validation results.
 * 
 * @template T - The type of event payload
 */
export type DetailedMessageValidator<T extends EventPayload = EventPayload> = (
  message: TypedKafkaMessage<T>
) => Promise<ValidationResult> | ValidationResult;

/**
 * Error handler function signature
 * 
 * Defines the contract for functions that handle errors during message processing.
 * Error handlers receive the error, the original message, and context information.
 */
export type ErrorHandler = (
  error: Error,
  message?: KafkaMessage,
  context?: {
    /** Topic where the error occurred */
    topic?: string;
    /** Partition where the error occurred */
    partition?: number;
    /** Retry count for this message */
    retryCount?: number;
    /** Whether this is a retriable error */
    retriable?: boolean;
    /** Additional error context */
    [key: string]: any;
  }
) => Promise<void>;

/**
 * Retry strategy function signature
 * 
 * Defines the contract for functions that determine retry behavior for failed messages.
 * Retry strategies receive the error, retry count, and original message, and return
 * the delay in milliseconds before the next retry attempt.
 * 
 * A return value of -1 indicates that the message should not be retried and
 * should be sent to the dead letter queue instead.
 */
export type RetryStrategy = (
  error: Error,
  retryCount: number,
  message?: KafkaMessage,
  context?: {
    /** Topic where the error occurred */
    topic?: string;
    /** Partition where the error occurred */
    partition?: number;
    /** Error code or type */
    errorCode?: string;
    /** Additional retry context */
    [key: string]: any;
  }
) => Promise<number> | number;

/**
 * Kafka consumer interface extending KafkaJS Consumer
 * 
 * This interface extends the Consumer interface from KafkaJS with typed
 * message handling. It provides type safety for message processing in the
 * gamification engine.
 * 
 * @template T - The type of event payload
 */
export interface TypedConsumer<T extends EventPayload = EventPayload> extends Omit<Consumer, 'run'> {
  /** Run the consumer with typed message handler */
  run: (options: {
    /** Handler for processing individual messages */
    eachMessage?: (payload: { 
      /** The typed message */
      message: TypedKafkaMessage<T>; 
      /** The topic the message was consumed from */
      topic: string; 
      /** The partition the message was consumed from */
      partition: number 
    }) => Promise<void>;
    /** Handler for processing batches of messages */
    eachBatch?: (payload: { 
      /** The batch of typed messages */
      batch: { 
        /** The messages in the batch */
        messages: TypedKafkaMessage<T>[],
        /** The topic the batch was consumed from */
        topic: string,
        /** The partition the batch was consumed from */
        partition: number,
        /** The first offset in the batch */
        firstOffset: string,
        /** The last offset in the batch */
        lastOffset: string,
        /** The number of messages in the batch */
        offsetLag: string
      }; 
      /** The topic the batch was consumed from */
      topic: string; 
      /** The partition the batch was consumed from */
      partition: number;
      /** Function to resolve the last processed offset */
      resolveOffset: (offset: string) => void;
      /** Function to commit offsets */
      commitOffsetsIfNecessary: () => Promise<void>;
      /** Function to heartbeat the consumer group coordinator */
      heartbeat: () => Promise<void>;
      /** Whether this is the last batch in the current poll */
      isRunning: () => boolean;
      /** Whether the consumer is paused */
      isPaused: () => boolean;
    }) => Promise<void>;
  }) => Promise<void>;
  
  /** Additional methods for enhanced consumer functionality */
  
  /** 
   * Process a message with the registered handler
   * 
   * @param message - The message to process
   * @param context - Optional processing context
   * @returns The processing result
   */
  processMessage?: (message: TypedKafkaMessage<T>, context?: MessageHandlerContext) => Promise<MessageProcessingResult>;
  
  /**
   * Register a message handler
   * 
   * @param handler - The handler function to register
   */
  registerHandler?: (handler: MessageHandler<T>) => void;
  
  /**
   * Register a message validator
   * 
   * @param validator - The validator function to register
   */
  registerValidator?: (validator: MessageValidator<T> | DetailedMessageValidator<T>) => void;
  
  /**
   * Register an error handler
   * 
   * @param handler - The error handler function to register
   */
  registerErrorHandler?: (handler: ErrorHandler) => void;
  
  /**
   * Set the retry strategy
   * 
   * @param strategy - The retry strategy function to use
   */
  setRetryStrategy?: (strategy: RetryStrategy) => void;
}

/**
 * Kafka producer interface extending KafkaJS Producer
 * 
 * This interface extends the Producer interface from KafkaJS with typed
 * message sending. It provides type safety for message production in the
 * gamification engine.
 * 
 * @template T - The type of event payload
 */
export interface TypedProducer<T extends EventPayload = EventPayload> extends Omit<Producer, 'send'> {
  /** Send a typed message */
  send: (record: Omit<ProducerRecord, 'messages'> & {
    /** The messages to send */
    messages: Array<{
      /** The typed message value */
      value: KafkaMessageValue<T>;
      /** Optional message key for partitioning */
      key?: string;
      /** Optional message headers */
      headers?: KafkaHeaders;
      /** Optional message timestamp */
      timestamp?: string;
      /** Optional target partition */
      partition?: number;
    }>;
  }) => Promise<RecordMetadata[]>;
  
  /** Additional methods for enhanced producer functionality */
  
  /**
   * Send a GamificationEvent to Kafka
   * 
   * @param event - The event to send
   * @param topic - Optional topic to send to (overrides default)
   * @param key - Optional message key for partitioning
   * @param headers - Optional additional headers
   * @returns The record metadata from Kafka
   */
  sendEvent?: (event: GamificationEvent<T>, topic?: string, key?: string, headers?: KafkaHeaders) => Promise<RecordMetadata[]>;
  
  /**
   * Send a batch of GamificationEvents to Kafka
   * 
   * @param events - The events to send
   * @param topic - Optional topic to send to (overrides default)
   * @returns The record metadata from Kafka
   */
  sendEvents?: (events: GamificationEvent<T>[], topic?: string) => Promise<RecordMetadata[]>;
  
  /**
   * Send a message to the dead letter queue
   * 
   * @param message - The original message that failed
   * @param error - The error that caused the failure
   * @param retryCount - The number of retry attempts
   * @returns The record metadata from Kafka
   */
  sendToDLQ?: (message: TypedKafkaMessage<T>, error: Error, retryCount: number) => Promise<RecordMetadata[]>;
}

/**
 * Converts a GamificationEvent to a Kafka message value
 * 
 * This utility function transforms a GamificationEvent from the @austa/interfaces
 * package into a KafkaMessageValue that can be sent to Kafka. It ensures that
 * all required fields are properly mapped.
 * 
 * @template T - The type of event payload
 * @param event - The GamificationEvent to convert
 * @returns A KafkaMessageValue representing the event
 */
export function eventToKafkaMessage<T extends EventPayload>(
  event: GamificationEvent<T>
): KafkaMessageValue<T> {
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    source: event.source,
    version: event.version,
    payload: event.payload,
    metadata: event.metadata
  };
}

/**
 * Converts a Kafka message value to a GamificationEvent
 * 
 * This utility function transforms a KafkaMessageValue received from Kafka
 * into a GamificationEvent from the @austa/interfaces package. It ensures that
 * all required fields are properly mapped.
 * 
 * @template T - The type of event payload
 * @param message - The KafkaMessageValue to convert
 * @returns A GamificationEvent representing the message
 */
export function kafkaMessageToEvent<T extends EventPayload>(
  message: KafkaMessageValue<T>
): GamificationEvent<T> {
  return {
    eventId: message.eventId,
    eventType: message.eventType,
    timestamp: message.timestamp,
    source: message.source,
    version: message.version,
    payload: message.payload,
    metadata: message.metadata
  };
}

/**
 * Kafka error types for categorizing errors during processing
 * 
 * These error types are used to determine whether an error is retriable
 * and how to handle it in the error handling pipeline.
 */
export enum KafkaErrorType {
  /** Connection errors (e.g., broker unavailable) */
  CONNECTION = 'CONNECTION',
  /** Authentication errors */
  AUTHENTICATION = 'AUTHENTICATION',
  /** Authorization errors */
  AUTHORIZATION = 'AUTHORIZATION',
  /** Message format errors */
  MESSAGE_FORMAT = 'MESSAGE_FORMAT',
  /** Schema validation errors */
  SCHEMA_VALIDATION = 'SCHEMA_VALIDATION',
  /** Processing errors in the message handler */
  PROCESSING = 'PROCESSING',
  /** Timeout errors */
  TIMEOUT = 'TIMEOUT',
  /** Broker errors */
  BROKER = 'BROKER',
  /** Unknown errors */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Kafka error with additional context for error handling
 * 
 * This class extends Error with additional properties for Kafka error handling,
 * including error type, retriability, and context information.
 */
export class KafkaError extends Error {
  /** The type of Kafka error */
  type: KafkaErrorType;
  /** Whether the error is retriable */
  retriable: boolean;
  /** The original error that caused this error */
  originalError?: Error;
  /** The message that caused the error */
  message: string;
  /** Additional error context */
  context?: Record<string, unknown>;
  /** Error code for categorization */
  code?: string;

  /**
   * Creates a new KafkaError
   * 
   * @param message - The error message
   * @param type - The error type
   * @param retriable - Whether the error is retriable
   * @param originalError - The original error that caused this error
   * @param context - Additional error context
   * @param code - Error code for categorization
   */
  constructor(
    message: string,
    type: KafkaErrorType = KafkaErrorType.UNKNOWN,
    retriable: boolean = false,
    originalError?: Error,
    context?: Record<string, unknown>,
    code?: string
  ) {
    super(message);
    this.name = 'KafkaError';
    this.type = type;
    this.retriable = retriable;
    this.originalError = originalError;
    this.context = context;
    this.code = code;
  }

  /**
   * Creates a connection error
   * 
   * @param message - The error message
   * @param originalError - The original error
   * @param context - Additional error context
   * @returns A new KafkaError with CONNECTION type
   */
  static connectionError(message: string, originalError?: Error, context?: Record<string, unknown>): KafkaError {
    return new KafkaError(message, KafkaErrorType.CONNECTION, true, originalError, context);
  }

  /**
   * Creates an authentication error
   * 
   * @param message - The error message
   * @param originalError - The original error
   * @param context - Additional error context
   * @returns A new KafkaError with AUTHENTICATION type
   */
  static authenticationError(message: string, originalError?: Error, context?: Record<string, unknown>): KafkaError {
    return new KafkaError(message, KafkaErrorType.AUTHENTICATION, false, originalError, context);
  }

  /**
   * Creates a message format error
   * 
   * @param message - The error message
   * @param originalError - The original error
   * @param context - Additional error context
   * @returns A new KafkaError with MESSAGE_FORMAT type
   */
  static messageFormatError(message: string, originalError?: Error, context?: Record<string, unknown>): KafkaError {
    return new KafkaError(message, KafkaErrorType.MESSAGE_FORMAT, false, originalError, context);
  }

  /**
   * Creates a schema validation error
   * 
   * @param message - The error message
   * @param originalError - The original error
   * @param context - Additional error context
   * @returns A new KafkaError with SCHEMA_VALIDATION type
   */
  static schemaValidationError(message: string, originalError?: Error, context?: Record<string, unknown>): KafkaError {
    return new KafkaError(message, KafkaErrorType.SCHEMA_VALIDATION, false, originalError, context);
  }

  /**
   * Creates a processing error
   * 
   * @param message - The error message
   * @param retriable - Whether the error is retriable
   * @param originalError - The original error
   * @param context - Additional error context
   * @returns A new KafkaError with PROCESSING type
   */
  static processingError(message: string, retriable: boolean = true, originalError?: Error, context?: Record<string, unknown>): KafkaError {
    return new KafkaError(message, KafkaErrorType.PROCESSING, retriable, originalError, context);
  }
}

/**
 * Creates a Kafka message with headers from a GamificationEvent
 * 
 * This utility function creates a complete Kafka message with both value and headers
 * from a GamificationEvent. It sets standard headers like correlationId, source,
 * timestamp, and schemaVersion based on the event data.
 * 
 * @template T - The type of event payload
 * @param event - The GamificationEvent to convert
 * @param additionalHeaders - Optional additional headers to include
 * @returns A TypedKafkaMessage representing the event
 */
export function createKafkaMessage<T extends EventPayload>(
  event: GamificationEvent<T>,
  additionalHeaders?: Record<string, string>
): TypedKafkaMessage<T> {
  const value = eventToKafkaMessage(event);
  
  // Extract correlation ID from metadata or generate a new one
  const correlationId = event.metadata?.correlationId as string || 
    `${event.source}-${event.eventType}-${Date.now()}`;
  
  // Create standard headers
  const headers: KafkaHeaders = {
    correlationId,
    source: event.source,
    timestamp: event.timestamp,
    schemaVersion: event.version,
    ...(event.metadata?.userId && { userId: event.metadata.userId as string }),
    ...(event.metadata?.journeyContext && { journeyContext: event.metadata.journeyContext as string }),
    ...additionalHeaders
  };
  
  return {
    // These fields are required by KafkaJS but will be populated by the broker
    offset: '0',
    size: 0,
    key: null,
    value,
    headers,
    timestamp: event.timestamp
  };
}

/**
 * Parses a Kafka message into a typed message with proper value and headers
 * 
 * This utility function parses a raw KafkaMessage from KafkaJS into a TypedKafkaMessage
 * with properly typed value and headers. It handles JSON parsing and validation.
 * 
 * @template T - The type of event payload
 * @param message - The raw KafkaMessage to parse
 * @returns A TypedKafkaMessage with properly typed value and headers
 * @throws Error if the message value cannot be parsed or is invalid
 */
export function parseKafkaMessage<T extends EventPayload>(
  message: KafkaMessage
): TypedKafkaMessage<T> {
  // Parse message value
  let value: KafkaMessageValue<T> | null = null;
  if (message.value) {
    try {
      const parsed = JSON.parse(message.value.toString());
      // Validate required fields
      if (!parsed.eventId || !parsed.eventType || !parsed.timestamp || 
          !parsed.source || !parsed.version || !parsed.payload) {
        throw new Error('Invalid message format: missing required fields');
      }
      value = parsed as KafkaMessageValue<T>;
    } catch (error) {
      throw new Error(`Failed to parse message value: ${error.message}`);
    }
  }
  
  // Parse headers
  const headers: KafkaHeaders = {};
  if (message.headers) {
    Object.entries(message.headers).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        headers[key] = val.toString();
      }
    });
  }
  
  return {
    ...message,
    value,
    headers
  };
}
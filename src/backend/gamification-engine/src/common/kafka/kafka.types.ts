/**
 * @file kafka.types.ts
 * @description TypeScript interfaces and types for Kafka operations in the gamification engine.
 * Provides type definitions for messages, headers, configuration options, and callback signatures.
 */

import { z } from 'zod';
import {
  GamificationEvent,
  EventType,
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload,
  EventVersion
} from '@austa/interfaces/gamification/events';

/**
 * Kafka message headers structure
 */
export interface KafkaHeaders {
  /** The version of the event schema */
  version: string;
  /** The source service or component that produced the event */
  source: string;
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  /** Timestamp when the event was produced (ISO string) */
  timestamp: string;
  /** Content type of the message payload */
  contentType: string;
}

/**
 * Base Kafka message interface with common properties for all messages
 */
export interface KafkaMessage<T = unknown> {
  /** Unique identifier for the message */
  key?: string;
  /** Message value/payload */
  value: T;
  /** Message headers */
  headers?: KafkaHeaders;
  /** Partition the message was consumed from */
  partition?: number;
  /** Offset of the message in the partition */
  offset?: string;
  /** Timestamp of the message */
  timestamp?: string;
}

/**
 * Kafka client configuration options
 */
export interface KafkaClientConfig {
  /** Client identifier */
  clientId: string;
  /** List of broker addresses in the format host:port */
  brokers: string[];
  /** SSL configuration for secure connections */
  ssl?: KafkaSSLConfig;
  /** SASL authentication configuration */
  sasl?: KafkaSASLConfig;
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Request timeout in milliseconds */
  requestTimeout?: number;
  /** Retry configuration for failed requests */
  retry?: KafkaRetryConfig;
  /** Logger configuration */
  logLevel?: KafkaLogLevel;
}

/**
 * SSL configuration for Kafka connections
 */
export interface KafkaSSLConfig {
  /** Whether to reject unauthorized connections */
  rejectUnauthorized?: boolean;
  /** CA certificate(s) */
  ca?: string | string[];
  /** Client key */
  key?: string;
  /** Client certificate */
  cert?: string;
}

/**
 * SASL authentication configuration for Kafka
 */
export interface KafkaSASLConfig {
  /** SASL mechanism (PLAIN, SCRAM-SHA-256, SCRAM-SHA-512) */
  mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
  /** Username for authentication */
  username: string;
  /** Password for authentication */
  password: string;
}

/**
 * Log levels for Kafka client
 */
export enum KafkaLogLevel {
  NOTHING = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 4,
  DEBUG = 5,
}

/**
 * Retry configuration for Kafka operations
 */
export interface KafkaRetryConfig {
  /** Initial retry delay in milliseconds */
  initialRetryTime?: number;
  /** Maximum retry time in milliseconds */
  maxRetryTime?: number;
  /** Factor by which retry time increases with each attempt */
  retryFactor?: number;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Whether to retry on specific error types */
  retryableErrors?: string[];
}

/**
 * Kafka producer configuration
 */
export interface KafkaProducerConfig {
  /** Whether to use transactions */
  transactional?: boolean;
  /** Transaction ID for transactional producers */
  transactionalId?: string;
  /** Maximum in-flight requests */
  maxInFlightRequests?: number;
  /** Idempotence setting to prevent duplicate messages */
  idempotent?: boolean;
  /** Compression type for messages */
  compression?: KafkaCompressionType;
  /** Batch size in bytes */
  batchSize?: number;
  /** Batch compression level */
  compressionLevel?: number;
  /** Retry configuration */
  retry?: KafkaRetryConfig;
  /** Acknowledgment level */
  acks?: KafkaAcks;
  /** Timeout for producing messages in milliseconds */
  timeout?: number;
}

/**
 * Compression types for Kafka messages
 */
export enum KafkaCompressionType {
  None = 0,
  GZIP = 1,
  Snappy = 2,
  LZ4 = 3,
  ZSTD = 4,
}

/**
 * Acknowledgment levels for Kafka producers
 */
export type KafkaAcks = -1 | 0 | 1 | 'all';

/**
 * Kafka consumer configuration
 */
export interface KafkaConsumerConfig {
  /** Consumer group ID */
  groupId: string;
  /** Group instance ID for static membership */
  groupInstanceId?: string;
  /** Partition assignment strategy */
  partitionAssignmentStrategy?: string;
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
  /** Rebalance timeout in milliseconds */
  rebalanceTimeout?: number;
  /** Heartbeat interval in milliseconds */
  heartbeatInterval?: number;
  /** Maximum bytes to fetch in a single request */
  maxBytesPerPartition?: number;
  /** Minimum bytes to accumulate before returning fetch response */
  minBytes?: number;
  /** Maximum wait time for fetch in milliseconds */
  maxWaitTimeInMs?: number;
  /** Whether to allow auto topic creation */
  allowAutoTopicCreation?: boolean;
  /** Maximum number of in-flight requests */
  maxInFlightRequests?: number;
  /** Retry configuration */
  retry?: KafkaRetryConfig;
  /** Read uncommitted messages */
  readUncommitted?: boolean;
}

/**
 * Topic subscription options for consumers
 */
export interface KafkaTopicSubscription {
  /** Topic name to subscribe to */
  topic: string;
  /** Whether to start consuming from the beginning of the topic */
  fromBeginning?: boolean;
  /** Specific partitions to subscribe to (optional) */
  partitions?: number[];
}

/**
 * Kafka consumer run options
 */
export interface KafkaConsumerRunOptions {
  /** Function to process each message */
  eachMessage?: (payload: KafkaEachMessagePayload) => Promise<void>;
  /** Function to process each batch of messages */
  eachBatch?: (payload: KafkaEachBatchPayload) => Promise<void>;
  /** Whether to autocommit offsets */
  autoCommit?: boolean;
  /** Partition concurrency limit */
  partitionsConsumedConcurrently?: number;
  /** Batch size for consuming messages */
  batchSize?: number;
}

/**
 * Payload for processing each message
 */
export interface KafkaEachMessagePayload {
  /** Topic the message was consumed from */
  topic: string;
  /** Partition the message was consumed from */
  partition: number;
  /** The message being consumed */
  message: KafkaMessage;
  /** Heartbeat function to keep the consumer alive during long processing */
  heartbeat?: () => Promise<void>;
  /** Function to pause consumption */
  pause?: () => void;
}

/**
 * Payload for processing each batch of messages
 */
export interface KafkaEachBatchPayload {
  /** Batch of messages */
  batch: {
    /** Topic the batch was consumed from */
    topic: string;
    /** Partition the batch was consumed from */
    partition: number;
    /** High watermark offset */
    highWatermark: string;
    /** Messages in the batch */
    messages: KafkaMessage[];
  };
  /** Function to resolve offset */
  resolveOffset: (offset: string) => void;
  /** Heartbeat function to keep the consumer alive during long processing */
  heartbeat: () => Promise<void>;
  /** Whether the batch is empty */
  isEmpty: () => boolean;
  /** Function to get the first offset in the batch */
  firstOffset: () => string | null;
  /** Function to get the last offset in the batch */
  lastOffset: () => string;
  /** Function to pause consumption */
  pause: () => void;
}

/**
 * Extended EventType enum with additional internal event types
 * These are used for internal processing and are not part of the public API
 */
export enum InternalEventType {
  /** Event that failed processing and was sent to the dead letter queue */
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  /** Event that was retried after a failure */
  RETRY_EVENT = 'RETRY_EVENT',
  /** Event that was successfully processed */
  PROCESSING_COMPLETED = 'PROCESSING_COMPLETED'
}

/**
 * Combined EventType enum with both public and internal event types
 */
export type ExtendedEventType = EventType | InternalEventType;

/**
 * Base Kafka event interface with common properties for all events
 */
export interface KafkaEvent<T = unknown> {
  /** Unique identifier for the event */
  eventId: string;
  /** Type of the event (from EventType enum) */
  type: EventType;
  /** User ID associated with the event */
  userId: string;
  /** Journey that the event belongs to (health, care, plan) */
  journey: 'health' | 'care' | 'plan';
  /** Timestamp when the event occurred (ISO string) */
  timestamp: string;
  /** Event schema version for backward compatibility */
  version: EventVersion;
  /** Event-specific payload data */
  data: T;
  /** Kafka-specific message headers */
  headers?: KafkaHeaders;
  /** Partition key for Kafka (usually userId for consistent routing) */
  partitionKey?: string;
}

/**
 * Health journey event with strongly typed payload
 */
export interface HealthKafkaEvent extends KafkaEvent<HealthEventPayload> {
  journey: 'health';
  type: 
    | EventType.HEALTH_METRIC_RECORDED
    | EventType.GOAL_CREATED
    | EventType.GOAL_PROGRESS_UPDATED
    | EventType.GOAL_ACHIEVED
    | EventType.DEVICE_CONNECTED
    | EventType.HEALTH_INSIGHT_GENERATED;
}

/**
 * Care journey event with strongly typed payload
 */
export interface CareKafkaEvent extends KafkaEvent<CareEventPayload> {
  journey: 'care';
  type: 
    | EventType.APPOINTMENT_BOOKED
    | EventType.APPOINTMENT_COMPLETED
    | EventType.APPOINTMENT_CANCELLED
    | EventType.MEDICATION_TAKEN
    | EventType.MEDICATION_SKIPPED
    | EventType.TELEMEDICINE_SESSION_STARTED
    | EventType.TELEMEDICINE_SESSION_COMPLETED
    | EventType.CARE_PLAN_CREATED
    | EventType.CARE_PLAN_UPDATED;
}

/**
 * Plan journey event with strongly typed payload
 */
export interface PlanKafkaEvent extends KafkaEvent<PlanEventPayload> {
  journey: 'plan';
  type: 
    | EventType.CLAIM_SUBMITTED
    | EventType.CLAIM_APPROVED
    | EventType.CLAIM_REJECTED
    | EventType.BENEFIT_UTILIZED
    | EventType.PLAN_SELECTED
    | EventType.PLAN_COMPARED
    | EventType.REWARD_REDEEMED;
}

/**
 * Union type of all journey-specific Kafka events
 * This creates a discriminated union based on the journey property
 */
export type JourneyKafkaEvent = 
  | HealthKafkaEvent 
  | CareKafkaEvent 
  | PlanKafkaEvent;

/**
 * Zod schema for validating Kafka headers
 */
export const kafkaHeadersSchema = z.object({
  version: z.string(),
  source: z.string(),
  correlationId: z.string().optional(),
  timestamp: z.string().datetime({ offset: true }),
  contentType: z.string().default('application/json')
});

/**
 * Base Zod schema for validating Kafka events
 */
export const baseKafkaEventSchema = z.object({
  eventId: z.string().uuid(),
  type: z.union([z.nativeEnum(EventType), z.nativeEnum(InternalEventType)]),
  userId: z.string().uuid(),
  journey: z.enum(['health', 'care', 'plan']),
  timestamp: z.string().datetime({ offset: true }),
  version: z.object({
    major: z.number().int().nonnegative(),
    minor: z.number().int().nonnegative(),
    patch: z.number().int().nonnegative()
  }),
  data: z.record(z.any()),
  headers: kafkaHeadersSchema.optional(),
  partitionKey: z.string().optional()
});

/**
 * Dead letter queue configuration
 */
export interface KafkaDLQConfig {
  /** Topic name for the dead letter queue */
  topic: string;
  /** Maximum number of retry attempts before sending to DLQ */
  maxRetryAttempts: number;
  /** Whether to include the original message in the DLQ message */
  includeOriginalMessage: boolean;
  /** Whether to include error details in the DLQ message */
  includeErrorDetails: boolean;
}

/**
 * Retry information for events that need to be retried
 */
export interface RetryInfo {
  /** Number of retry attempts so far */
  attemptCount: number;
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Timestamp of the first attempt */
  firstAttemptTimestamp: string;
  /** Timestamp of the last attempt */
  lastAttemptTimestamp: string;
  /** Delay in milliseconds before the next retry */
  nextRetryDelayMs: number;
  /** Error information from the last attempt */
  lastError?: {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
  };
}

/**
 * Error classification for Kafka operations
 */
export enum KafkaErrorType {
  /** Temporary error that can be retried */
  RETRIABLE = 'RETRIABLE',
  /** Permanent error that should not be retried */
  TERMINAL = 'TERMINAL',
  /** Error related to message validation */
  VALIDATION = 'VALIDATION',
  /** Error related to Kafka connection */
  CONNECTION = 'CONNECTION',
  /** Error related to Kafka authentication */
  AUTHENTICATION = 'AUTHENTICATION',
  /** Error related to Kafka authorization */
  AUTHORIZATION = 'AUTHORIZATION',
  /** Error related to message processing */
  PROCESSING = 'PROCESSING',
  /** Unknown error type */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Kafka error with classification
 */
export interface KafkaError extends Error {
  /** Error type for classification */
  type: KafkaErrorType;
  /** Error code for programmatic handling */
  code?: string;
  /** Original error that caused this error */
  originalError?: Error;
  /** Whether the error is retriable */
  retriable: boolean;
  /** Metadata about the error */
  metadata?: Record<string, unknown>;
}

/**
 * Result of event validation with detailed error information
 */
export interface EventValidationResult<T> {
  /** Whether the validation was successful */
  success: boolean;
  /** The validated event (if successful) */
  event?: T;
  /** Validation error details (if unsuccessful) */
  error?: {
    /** Error message */
    message: string;
    /** Path to the error in the event object */
    path?: string[];
    /** Error code for programmatic handling */
    code?: string;
  };
}

/**
 * Kafka admin configuration
 */
export interface KafkaAdminConfig {
  /** Timeout for admin operations in milliseconds */
  timeout?: number;
}

/**
 * Topic configuration for Kafka admin operations
 */
export interface KafkaTopicConfig {
  /** Topic name */
  topic: string;
  /** Number of partitions */
  numPartitions?: number;
  /** Replication factor */
  replicationFactor?: number;
  /** Topic configurations */
  configEntries?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Kafka transaction configuration
 */
export interface KafkaTransactionConfig {
  /** Transaction ID */
  transactionalId: string;
  /** Transaction timeout in milliseconds */
  timeout?: number;
}

/**
 * Kafka message production options
 */
export interface KafkaProducerSendOptions {
  /** Topic to send the message to */
  topic: string;
  /** Messages to send */
  messages: Array<{
    /** Message key */
    key?: string;
    /** Message value */
    value: string | Buffer;
    /** Message headers */
    headers?: Record<string, string>;
    /** Message timestamp */
    timestamp?: string;
    /** Message partition */
    partition?: number;
  }>;
  /** Compression type */
  compression?: KafkaCompressionType;
  /** Acknowledgment level */
  acks?: KafkaAcks;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Kafka message handler interface
 */
export interface KafkaMessageHandler<T = unknown> {
  /**
   * Handles a Kafka message
   * @param message The message to handle
   * @returns A promise that resolves when the message has been handled
   */
  handle(message: KafkaMessage<T>): Promise<void>;
  
  /**
   * Validates a Kafka message
   * @param message The message to validate
   * @returns A promise that resolves with the validation result
   */
  validate?(message: KafkaMessage<T>): Promise<EventValidationResult<T>>;
  
  /**
   * Handles an error that occurred during message processing
   * @param error The error that occurred
   * @param message The message that caused the error
   * @returns A promise that resolves when the error has been handled
   */
  handleError?(error: Error, message: KafkaMessage<T>): Promise<void>;
}

/**
 * Kafka event handler interface
 */
export interface KafkaEventHandler<T = unknown> {
  /**
   * Handles a Kafka event
   * @param event The event to handle
   * @returns A promise that resolves when the event has been handled
   */
  handle(event: KafkaEvent<T>): Promise<void>;
  
  /**
   * Validates a Kafka event
   * @param event The event to validate
   * @returns A promise that resolves with the validation result
   */
  validate?(event: KafkaEvent<T>): Promise<EventValidationResult<KafkaEvent<T>>>;
  
  /**
   * Handles an error that occurred during event processing
   * @param error The error that occurred
   * @param event The event that caused the error
   * @returns A promise that resolves when the error has been handled
   */
  handleError?(error: Error, event: KafkaEvent<T>): Promise<void>;
  
  /**
   * Gets the event types that this handler can process
   * @returns An array of event types
   */
  getEventTypes(): EventType[];
  
  /**
   * Gets the journey that this handler is responsible for
   * @returns The journey name
   */
  getJourney(): 'health' | 'care' | 'plan';
}

/**
 * Helper function to create a versioned event
 * @param event Base event data
 * @param version Event schema version
 * @returns Versioned event with proper headers
 */
export function createVersionedEvent<T>(
  event: Omit<KafkaEvent<T>, 'version' | 'headers'>,
  version: EventVersion = { major: 1, minor: 0, patch: 0 }
): KafkaEvent<T> {
  return {
    ...event,
    version,
    headers: {
      version: `${version.major}.${version.minor}.${version.patch}`,
      source: 'gamification-engine',
      timestamp: new Date().toISOString(),
      contentType: 'application/json'
    },
    partitionKey: event.userId
  };
}

/**
 * Converts a GamificationEvent from @austa/interfaces to a Kafka-specific event
 * @param event Standard gamification event
 * @returns Kafka-formatted event with headers and partition key
 */
export function toKafkaEvent<T>(event: GamificationEvent<T>): KafkaEvent<T> {
  return {
    ...event,
    headers: {
      version: `${event.version.major}.${event.version.minor}.${event.version.patch}`,
      source: event.source || 'gamification-engine',
      timestamp: event.timestamp,
      contentType: 'application/json',
      correlationId: event.correlationId
    },
    partitionKey: event.userId
  };
}

/**
 * Converts a Kafka-specific event to a standard GamificationEvent
 * @param kafkaEvent Kafka-formatted event
 * @returns Standard gamification event
 */
export function fromKafkaEvent<T>(kafkaEvent: KafkaEvent<T>): GamificationEvent<T> {
  const { headers, partitionKey, ...eventData } = kafkaEvent;
  
  return {
    ...eventData,
    source: headers?.source || 'unknown',
    correlationId: headers?.correlationId
  };
}

/**
 * Type guard to check if an event is a Health journey event
 * @param event Event to check
 * @returns True if the event is from the Health journey
 */
export function isHealthEvent(event: JourneyKafkaEvent): event is HealthKafkaEvent {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is a Care journey event
 * @param event Event to check
 * @returns True if the event is from the Care journey
 */
export function isCareEvent(event: JourneyKafkaEvent): event is CareKafkaEvent {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is a Plan journey event
 * @param event Event to check
 * @returns True if the event is from the Plan journey
 */
export function isPlanEvent(event: JourneyKafkaEvent): event is PlanKafkaEvent {
  return event.journey === 'plan';
}

/**
 * Validates a Kafka event against its schema
 * @param event Event to validate
 * @returns Validated event or throws an error
 */
export function validateKafkaEvent<T>(event: KafkaEvent<T>): KafkaEvent<T> {
  return baseKafkaEventSchema.parse(event) as KafkaEvent<T>;
}

/**
 * Safely validates a Kafka event without throwing exceptions
 * @param event Event to validate
 * @returns Validation result with success flag and error details
 */
export function safeValidateKafkaEvent<T>(event: KafkaEvent<T>): EventValidationResult<KafkaEvent<T>> {
  const result = baseKafkaEventSchema.safeParse(event);
  
  if (result.success) {
    return { success: true, event: result.data as KafkaEvent<T> };
  } else {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: {
        message: firstError.message,
        path: firstError.path.map(p => p.toString()),
        code: 'INVALID_EVENT_FORMAT'
      }
    };
  }
}

/**
 * Checks if an event version is compatible with the current system version
 * @param eventVersion Version of the incoming event
 * @param systemVersion Current system version (defaults to 1.0.0)
 * @returns Whether the event version is compatible
 */
export function isVersionCompatible(
  eventVersion: EventVersion,
  systemVersion: EventVersion = { major: 1, minor: 0, patch: 0 }
): boolean {
  // Major version must match for compatibility
  return eventVersion.major === systemVersion.major;
}

/**
 * Creates a dead letter event for events that failed processing
 * @param originalEvent The original event that failed
 * @param error Error information
 * @returns Dead letter event for error tracking
 */
export function createDeadLetterEvent<T>(
  originalEvent: Partial<KafkaEvent<T>>,
  error: { message: string; code?: string; stack?: string }
): KafkaEvent<{ originalEvent: Partial<KafkaEvent<T>>; error: any }> {
  return {
    eventId: crypto.randomUUID(),
    type: InternalEventType.PROCESSING_ERROR as any,
    userId: originalEvent.userId || 'unknown',
    journey: originalEvent.journey || 'unknown' as any,
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: 0, patch: 0 },
    data: {
      originalEvent,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    },
    headers: {
      version: '1.0.0',
      source: 'gamification-engine',
      timestamp: new Date().toISOString(),
      contentType: 'application/json'
    },
    partitionKey: originalEvent.userId || 'unknown'
  };
}

/**
 * Creates a retry event for events that need to be retried
 * @param originalEvent The original event that failed
 * @param retryInfo Retry information
 * @returns Retry event for the retry queue
 */
export function createRetryEvent<T>(
  originalEvent: KafkaEvent<T>,
  retryInfo: RetryInfo
): KafkaEvent<{ originalEvent: KafkaEvent<T>; retryInfo: RetryInfo }> {
  return {
    eventId: crypto.randomUUID(),
    type: InternalEventType.RETRY_EVENT as any,
    userId: originalEvent.userId,
    journey: originalEvent.journey,
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: 0, patch: 0 },
    data: {
      originalEvent,
      retryInfo: {
        ...retryInfo,
        lastAttemptTimestamp: new Date().toISOString()
      }
    },
    headers: {
      version: '1.0.0',
      source: 'gamification-engine',
      timestamp: new Date().toISOString(),
      contentType: 'application/json'
    },
    partitionKey: originalEvent.userId
  };
}

/**
 * Calculates the next retry delay using exponential backoff
 * @param attemptCount Current attempt count (starting from 1)
 * @param baseDelayMs Base delay in milliseconds (default: 1000)
 * @param maxDelayMs Maximum delay in milliseconds (default: 60000)
 * @returns Delay in milliseconds before the next retry
 */
export function calculateExponentialBackoff(
  attemptCount: number,
  baseDelayMs = 1000,
  maxDelayMs = 60000
): number {
  // Exponential backoff with jitter: baseDelay * 2^(attemptCount-1) * (0.5 + random(0, 0.5))
  const exponentialDelay = baseDelayMs * Math.pow(2, attemptCount - 1);
  const jitter = 0.5 + Math.random() * 0.5;
  const delay = exponentialDelay * jitter;
  
  // Cap at maximum delay
  return Math.min(delay, maxDelayMs);
}

/**
 * Extracts the original event from a retry event
 * @param retryEvent Retry event
 * @returns The original event and retry information
 */
export function extractOriginalEvent<T>(retryEvent: KafkaEvent<{ originalEvent: KafkaEvent<T>; retryInfo: RetryInfo }>): {
  originalEvent: KafkaEvent<T>;
  retryInfo: RetryInfo;
} {
  return {
    originalEvent: retryEvent.data.originalEvent,
    retryInfo: retryEvent.data.retryInfo
  };
}

/**
 * Creates a completion event for events that were successfully processed
 * @param originalEvent The original event that was processed
 * @param result Processing result information
 * @returns Completion event for tracking
 */
export function createCompletionEvent<T, R>(
  originalEvent: KafkaEvent<T>,
  result: R
): KafkaEvent<{ originalEvent: KafkaEvent<T>; result: R }> {
  return {
    eventId: crypto.randomUUID(),
    type: InternalEventType.PROCESSING_COMPLETED as any,
    userId: originalEvent.userId,
    journey: originalEvent.journey,
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: 0, patch: 0 },
    data: {
      originalEvent,
      result
    },
    headers: {
      version: '1.0.0',
      source: 'gamification-engine',
      timestamp: new Date().toISOString(),
      contentType: 'application/json'
    },
    partitionKey: originalEvent.userId
  };
}
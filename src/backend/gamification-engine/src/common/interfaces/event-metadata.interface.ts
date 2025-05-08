/**
 * @file event-metadata.interface.ts
 * @description Defines metadata interfaces for event processing, including source information,
 * processing status, and additional context data. These interfaces provide crucial metadata
 * for event tracking, retry logic, and debugging throughout the event processing pipeline
 * in the gamification engine.
 *
 * This file implements the following requirements from the technical specification:
 * - Standardized, versioned event schemas defined in @austa/interfaces package
 * - Implement dead letter queues for failed events
 * - Create retry mechanisms with exponential backoff
 * - Develop event audit and logging system
 */

import { JourneyType } from '@austa/interfaces/common';
import { EventTypeId } from '../../events/interfaces/event-type.interface';

/**
 * Interface for event source information.
 * Tracks the origin of an event for auditing and debugging purposes.
 */
export interface IEventSource {
  /**
   * The service or component that generated the event
   * @example 'health-service', 'care-service', 'plan-service', 'gamification-engine'
   */
  serviceName: string;

  /**
   * The journey context in which the event was generated
   * Optional for system-generated events
   */
  journey?: JourneyType;

  /**
   * The specific component or module within the service that generated the event
   * @example 'metrics-controller', 'appointment-service', 'claim-processor'
   */
  component?: string;

  /**
   * The instance ID of the service that generated the event
   * Useful for distributed tracing in multi-instance deployments
   */
  instanceId?: string;

  /**
   * The version of the service that generated the event
   * @example '1.0.0', '2.3.1'
   */
  serviceVersion?: string;
}

/**
 * Interface for event tracking information.
 * Provides identifiers and timestamps for event tracing and correlation.
 */
export interface IEventTracking {
  /**
   * Unique identifier for the event
   * Used for deduplication and tracking
   */
  eventId: string;

  /**
   * Correlation ID for tracking related events across services
   * Preserved throughout the event processing pipeline
   */
  correlationId: string;

  /**
   * Optional parent event ID for events that are generated as a result of another event
   * Creates a hierarchical relationship between events
   */
  parentEventId?: string;

  /**
   * Timestamp when the event was created
   * ISO 8601 format
   */
  timestamp: string;

  /**
   * Optional trace ID for distributed tracing
   * Compatible with OpenTelemetry and other tracing systems
   */
  traceId?: string;

  /**
   * Optional span ID for distributed tracing
   * Compatible with OpenTelemetry and other tracing systems
   */
  spanId?: string;
}

/**
 * Interface for event version information.
 * Supports the event versioning strategy for backward compatibility.
 */
export interface IEventVersion {
  /**
   * Semantic version of the event schema
   * @example '1.0.0', '2.3.1'
   */
  schemaVersion: string;

  /**
   * Optional flag indicating if this event uses a deprecated schema version
   * Useful for logging and monitoring purposes
   */
  deprecated?: boolean;

  /**
   * Optional target schema version for automatic upgrading
   * If provided, the event will be automatically upgraded to this version
   * @example '2.0.0'
   */
  targetVersion?: string;
}

/**
 * Main interface for event metadata.
 * Combines source, tracking, and version information.
 */
export interface IEventMetadata {
  /**
   * Information about the source of the event
   */
  source: IEventSource;

  /**
   * Tracking information for the event
   */
  tracking: IEventTracking;

  /**
   * Version information for the event schema
   */
  version: IEventVersion;

  /**
   * The type of the event
   * @example 'HEALTH_METRIC_RECORDED', 'APPOINTMENT_COMPLETED', 'CLAIM_SUBMITTED'
   */
  type: EventTypeId;

  /**
   * Optional additional context data
   * Can contain journey-specific or event-specific metadata
   */
  context?: Record<string, any>;
}

/**
 * Processing status for an event.
 * Tracks the current state of event processing.
 */
export enum EventProcessingStatus {
  /**
   * Event has been received but processing has not started
   */
  RECEIVED = 'RECEIVED',

  /**
   * Event is currently being processed
   */
  PROCESSING = 'PROCESSING',

  /**
   * Event has been successfully processed
   */
  COMPLETED = 'COMPLETED',

  /**
   * Event processing failed but will be retried
   */
  FAILED_RETRYABLE = 'FAILED_RETRYABLE',

  /**
   * Event processing failed and will not be retried
   */
  FAILED_TERMINAL = 'FAILED_TERMINAL',

  /**
   * Event has been sent to the dead letter queue
   */
  DEAD_LETTERED = 'DEAD_LETTERED',

  /**
   * Event has been skipped due to business rules
   */
  SKIPPED = 'SKIPPED',

  /**
   * Event is a duplicate and has been ignored
   */
  DUPLICATE = 'DUPLICATE'
}

/**
 * Interface for retry information.
 * Tracks retry attempts and backoff strategy for failed events.
 */
export interface IRetryInfo {
  /**
   * Number of retry attempts made so far
   */
  attemptCount: number;

  /**
   * Maximum number of retry attempts allowed
   */
  maxAttempts: number;

  /**
   * Timestamp of the last retry attempt
   * ISO 8601 format
   */
  lastAttemptAt?: string;

  /**
   * Timestamp when the next retry should be attempted
   * ISO 8601 format
   */
  nextAttemptAt?: string;

  /**
   * Backoff strategy for retry attempts
   * @example 'exponential', 'linear', 'fixed'
   */
  backoffStrategy: 'exponential' | 'linear' | 'fixed';

  /**
   * Base delay in milliseconds for retry attempts
   */
  baseDelayMs: number;

  /**
   * Maximum delay in milliseconds for retry attempts
   */
  maxDelayMs: number;

  /**
   * Optional jitter factor for randomizing retry delays
   * Value between 0 and 1
   */
  jitterFactor?: number;
}

/**
 * Interface for error information.
 * Provides details about processing errors for failed events.
 */
export interface IErrorInfo {
  /**
   * Error code for categorizing the error
   * @example 'VALIDATION_ERROR', 'DATABASE_ERROR', 'NETWORK_ERROR'
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Optional stack trace for debugging
   */
  stack?: string;

  /**
   * Whether the error is retryable
   */
  retryable: boolean;

  /**
   * Optional additional error details
   */
  details?: Record<string, any>;

  /**
   * Optional timestamp when the error occurred
   * ISO 8601 format
   */
  timestamp?: string;
}

/**
 * Interface for event processing metadata.
 * Tracks the processing status and history of an event.
 */
export interface IEventProcessingMetadata {
  /**
   * Current processing status of the event
   */
  status: EventProcessingStatus;

  /**
   * Timestamp when processing started
   * ISO 8601 format
   */
  startedAt?: string;

  /**
   * Timestamp when processing completed (successfully or with terminal failure)
   * ISO 8601 format
   */
  completedAt?: string;

  /**
   * Duration of processing in milliseconds
   */
  durationMs?: number;

  /**
   * Retry information for failed events
   * Only present if status is FAILED_RETRYABLE
   */
  retry?: IRetryInfo;

  /**
   * Error information for failed events
   * Only present if status is FAILED_RETRYABLE or FAILED_TERMINAL
   */
  error?: IErrorInfo;

  /**
   * ID of the processor that handled the event
   */
  processorId?: string;

  /**
   * Optional processing history for auditing and debugging
   * Each entry represents a processing attempt
   */
  history?: Array<{
    status: EventProcessingStatus;
    timestamp: string;
    processorId?: string;
    error?: IErrorInfo;
    durationMs?: number;
  }>;
}

/**
 * Interface for Kafka message headers.
 * Provides compatibility with Kafka message headers for event metadata.
 */
export interface IKafkaEventHeaders {
  /**
   * Event ID header
   */
  'event-id': string;

  /**
   * Correlation ID header
   */
  'correlation-id': string;

  /**
   * Event type header
   */
  'event-type': string;

  /**
   * Source service header
   */
  'source-service': string;

  /**
   * Journey header (optional)
   */
  'journey'?: string;

  /**
   * Schema version header
   */
  'schema-version': string;

  /**
   * Timestamp header
   */
  'timestamp': string;

  /**
   * Trace ID header (optional)
   */
  'trace-id'?: string;

  /**
   * Span ID header (optional)
   */
  'span-id'?: string;

  /**
   * Retry count header (optional)
   */
  'retry-count'?: string;

  /**
   * Additional headers
   */
  [key: string]: string;
}

/**
 * Utility type to extract event metadata from an event object.
 * @template T The event type
 */
export type ExtractEventMetadata<T> = T extends { metadata: infer M } ? M : never;

/**
 * Utility type to extract event processing metadata from an event object.
 * @template T The event type
 */
export type ExtractProcessingMetadata<T> = T extends { processingMetadata: infer M } ? M : never;

/**
 * Utility function to create event metadata.
 * @param type The event type
 * @param serviceName The source service name
 * @param journey Optional journey context
 * @returns IEventMetadata object
 */
export function createEventMetadata(
  type: EventTypeId,
  serviceName: string,
  journey?: JourneyType
): IEventMetadata {
  const eventId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const correlationId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  return {
    source: {
      serviceName,
      journey,
      instanceId: process.env.INSTANCE_ID || undefined,
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0'
    },
    tracking: {
      eventId,
      correlationId,
      timestamp: new Date().toISOString()
    },
    version: {
      schemaVersion: '1.0.0'
    },
    type
  };
}

/**
 * Utility function to create initial event processing metadata.
 * @returns IEventProcessingMetadata object with RECEIVED status
 */
export function createInitialProcessingMetadata(): IEventProcessingMetadata {
  return {
    status: EventProcessingStatus.RECEIVED,
    startedAt: new Date().toISOString(),
    history: [
      {
        status: EventProcessingStatus.RECEIVED,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/**
 * Utility function to update event processing metadata with a new status.
 * @param metadata The current processing metadata
 * @param status The new status
 * @param error Optional error information
 * @returns Updated IEventProcessingMetadata object
 */
export function updateProcessingMetadata(
  metadata: IEventProcessingMetadata,
  status: EventProcessingStatus,
  error?: IErrorInfo
): IEventProcessingMetadata {
  const now = new Date();
  const startedAt = metadata.startedAt ? new Date(metadata.startedAt) : now;
  const durationMs = now.getTime() - startedAt.getTime();
  
  const historyEntry = {
    status,
    timestamp: now.toISOString(),
    processorId: metadata.processorId,
    error,
    durationMs
  };
  
  const updatedMetadata: IEventProcessingMetadata = {
    ...metadata,
    status,
    durationMs,
    history: [...(metadata.history || []), historyEntry]
  };
  
  if (error) {
    updatedMetadata.error = error;
  }
  
  if (status === EventProcessingStatus.COMPLETED || 
      status === EventProcessingStatus.FAILED_TERMINAL || 
      status === EventProcessingStatus.DEAD_LETTERED) {
    updatedMetadata.completedAt = now.toISOString();
  }
  
  return updatedMetadata;
}

/**
 * Utility function to convert event metadata to Kafka headers.
 * @param metadata The event metadata
 * @returns Kafka headers object
 */
export function metadataToKafkaHeaders(metadata: IEventMetadata): IKafkaEventHeaders {
  const headers: IKafkaEventHeaders = {
    'event-id': metadata.tracking.eventId,
    'correlation-id': metadata.tracking.correlationId,
    'event-type': metadata.type,
    'source-service': metadata.source.serviceName,
    'schema-version': metadata.version.schemaVersion,
    'timestamp': metadata.tracking.timestamp
  };
  
  if (metadata.source.journey) {
    headers.journey = metadata.source.journey;
  }
  
  if (metadata.tracking.traceId) {
    headers['trace-id'] = metadata.tracking.traceId;
  }
  
  if (metadata.tracking.spanId) {
    headers['span-id'] = metadata.tracking.spanId;
  }
  
  return headers;
}

/**
 * Utility function to convert Kafka headers to event metadata.
 * @param headers The Kafka headers
 * @returns IEventMetadata object
 */
export function kafkaHeadersToMetadata(headers: IKafkaEventHeaders): IEventMetadata {
  return {
    source: {
      serviceName: headers['source-service'],
      journey: headers.journey as JourneyType | undefined,
    },
    tracking: {
      eventId: headers['event-id'],
      correlationId: headers['correlation-id'],
      timestamp: headers.timestamp,
      traceId: headers['trace-id'],
      spanId: headers['span-id']
    },
    version: {
      schemaVersion: headers['schema-version']
    },
    type: headers['event-type'] as EventTypeId
  };
}
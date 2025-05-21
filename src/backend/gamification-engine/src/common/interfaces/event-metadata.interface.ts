/**
 * @file event-metadata.interface.ts
 * @description Defines metadata interfaces for event processing, including source information,
 * processing status, and additional context data. These interfaces provide crucial metadata
 * for event tracking, retry logic, and debugging throughout the event processing pipeline
 * in the gamification engine.
 */

import { ISemanticVersion } from './versioning.interface';
import { IRetryContext, IRetryPolicy } from './retry-policy.interface';
import { KafkaHeaders } from '../kafka/kafka.types';

/**
 * Interface for event source metadata
 * Provides information about the origin of an event
 */
export interface IEventSourceMetadata {
  /** Service or component that produced the event */
  source: string;
  
  /** Specific module or subcomponent within the source */
  module?: string;
  
  /** Journey that the event belongs to (health, care, plan) */
  journey: 'health' | 'care' | 'plan' | 'gamification';
  
  /** Environment where the event was produced (dev, staging, prod) */
  environment?: string;
  
  /** Instance ID of the source service (for distributed systems) */
  instanceId?: string;
}

/**
 * Interface for event tracking metadata
 * Provides information for tracing and correlating events
 */
export interface IEventTrackingMetadata {
  /** Correlation ID for distributed tracing */
  correlationId: string;
  
  /** Timestamp when the event was produced (ISO string) */
  timestamp: string;
  
  /** Unique identifier for the event */
  eventId: string;
  
  /** User ID associated with the event */
  userId: string;
  
  /** Session ID if the event was generated during a user session */
  sessionId?: string;
  
  /** Request ID if the event was generated as part of an API request */
  requestId?: string;
  
  /** Parent event ID if this event was triggered by another event */
  parentEventId?: string;
  
  /** Sequence number for ordering events */
  sequenceNumber?: number;
}

/**
 * Interface for event version metadata
 * Provides information about the schema version of the event
 */
export interface IEventVersionMetadata {
  /** Schema version of the event */
  schemaVersion: ISemanticVersion;
  
  /** Content type of the event payload */
  contentType: string;
  
  /** Schema URL for validation (optional) */
  schemaUrl?: string;
  
  /** Whether this event uses a deprecated schema version */
  deprecated?: boolean;
  
  /** Latest compatible version if this version is deprecated */
  latestVersion?: ISemanticVersion;
}

/**
 * Interface for event processing metadata
 * Provides information about the processing status of an event
 */
export interface IEventProcessingMetadata {
  /** Current processing status of the event */
  status: EventProcessingStatus;
  
  /** Timestamp when processing started */
  processingStartedAt?: string;
  
  /** Timestamp when processing completed */
  processingCompletedAt?: string;
  
  /** Duration of processing in milliseconds */
  processingDurationMs?: number;
  
  /** Number of processing attempts */
  attemptCount: number;
  
  /** Maximum number of processing attempts allowed */
  maxAttempts: number;
  
  /** Timestamp of the next retry attempt (if applicable) */
  nextRetryAt?: string;
  
  /** Delay before the next retry attempt in milliseconds */
  nextRetryDelayMs?: number;
  
  /** Error information if processing failed */
  error?: {
    /** Error message */
    message: string;
    
    /** Error code */
    code?: string;
    
    /** Error stack trace */
    stack?: string;
    
    /** Timestamp when the error occurred */
    timestamp: string;
  };
  
  /** Whether the event was sent to the dead letter queue */
  sentToDlq?: boolean;
  
  /** Timestamp when the event was sent to the dead letter queue */
  sentToDlqAt?: string;
  
  /** Retry policy used for this event */
  retryPolicy?: IRetryPolicy;
}

/**
 * Enum for event processing status
 */
export enum EventProcessingStatus {
  /** Event is pending processing */
  PENDING = 'PENDING',
  
  /** Event is currently being processed */
  PROCESSING = 'PROCESSING',
  
  /** Event was processed successfully */
  COMPLETED = 'COMPLETED',
  
  /** Event processing failed and will be retried */
  FAILED_RETRYING = 'FAILED_RETRYING',
  
  /** Event processing failed permanently */
  FAILED_TERMINAL = 'FAILED_TERMINAL',
  
  /** Event was sent to the dead letter queue */
  DEAD_LETTER = 'DEAD_LETTER',
  
  /** Event was skipped due to business rules */
  SKIPPED = 'SKIPPED',
  
  /** Event was duplicated and ignored */
  DUPLICATE = 'DUPLICATE'
}

/**
 * Interface for additional context metadata
 * Provides supplementary information for event processing
 */
export interface IEventContextMetadata {
  /** Additional business context for the event */
  businessContext?: Record<string, unknown>;
  
  /** Technical context for the event */
  technicalContext?: Record<string, unknown>;
  
  /** Feature flags active when the event was produced */
  featureFlags?: Record<string, boolean>;
  
  /** Tags for categorizing the event */
  tags?: string[];
  
  /** Priority of the event (higher number = higher priority) */
  priority?: number;
  
  /** Whether the event is part of a batch */
  isBatchEvent?: boolean;
  
  /** Batch ID if the event is part of a batch */
  batchId?: string;
  
  /** Journey-specific context data */
  journeyContext?: {
    /** Journey type */
    journeyType: 'health' | 'care' | 'plan';
    
    /** Journey-specific data */
    data: Record<string, unknown>;
  };
}

/**
 * Main interface for event metadata
 * Combines all metadata interfaces into a single comprehensive interface
 */
export interface IEventMetadata {
  /** Source information */
  source: IEventSourceMetadata;
  
  /** Tracking information */
  tracking: IEventTrackingMetadata;
  
  /** Version information */
  version: IEventVersionMetadata;
  
  /** Processing information (optional, may not be present in raw events) */
  processing?: IEventProcessingMetadata;
  
  /** Additional context information (optional) */
  context?: IEventContextMetadata;
}

/**
 * Interface for event metadata with processing status
 * Ensures that processing metadata is present
 */
export interface IProcessedEventMetadata extends IEventMetadata {
  /** Processing information (required in processed events) */
  processing: IEventProcessingMetadata;
}

/**
 * Type guard to check if event metadata includes processing information
 * @param metadata The metadata to check
 * @returns True if the metadata includes processing information
 */
export function hasProcessingMetadata(metadata: IEventMetadata): metadata is IProcessedEventMetadata {
  return !!metadata.processing;
}

/**
 * Converts Kafka headers to event metadata
 * @param headers Kafka message headers
 * @param eventId Event ID
 * @param userId User ID
 * @param journey Journey type
 * @returns Event metadata constructed from Kafka headers
 */
export function kafkaHeadersToEventMetadata(
  headers: KafkaHeaders,
  eventId: string,
  userId: string,
  journey: 'health' | 'care' | 'plan' | 'gamification'
): IEventMetadata {
  // Parse version from string (e.g., "1.0.0" to { major: 1, minor: 0, patch: 0 })
  const versionParts = headers.version.split('.');
  const schemaVersion: ISemanticVersion = {
    major: parseInt(versionParts[0], 10) || 0,
    minor: parseInt(versionParts[1], 10) || 0,
    patch: parseInt(versionParts[2], 10) || 0
  };
  
  return {
    source: {
      source: headers.source,
      journey
    },
    tracking: {
      correlationId: headers.correlationId || crypto.randomUUID(),
      timestamp: headers.timestamp,
      eventId,
      userId
    },
    version: {
      schemaVersion,
      contentType: headers.contentType || 'application/json'
    }
  };
}

/**
 * Converts event metadata to Kafka headers
 * @param metadata Event metadata
 * @returns Kafka headers constructed from event metadata
 */
export function eventMetadataToKafkaHeaders(metadata: IEventMetadata): KafkaHeaders {
  return {
    version: `${metadata.version.schemaVersion.major}.${metadata.version.schemaVersion.minor}.${metadata.version.schemaVersion.patch}`,
    source: metadata.source.source,
    correlationId: metadata.tracking.correlationId,
    timestamp: metadata.tracking.timestamp,
    contentType: metadata.version.contentType
  };
}

/**
 * Creates initial processing metadata for a new event
 * @param maxAttempts Maximum number of processing attempts
 * @returns Initial processing metadata
 */
export function createInitialProcessingMetadata(maxAttempts = 5): IEventProcessingMetadata {
  return {
    status: EventProcessingStatus.PENDING,
    attemptCount: 0,
    maxAttempts,
    processingStartedAt: new Date().toISOString()
  };
}

/**
 * Updates processing metadata for a successful event
 * @param metadata Current processing metadata
 * @returns Updated processing metadata
 */
export function markEventProcessingSuccess(metadata: IEventProcessingMetadata): IEventProcessingMetadata {
  const now = new Date();
  const processingStartedAt = metadata.processingStartedAt ? new Date(metadata.processingStartedAt) : now;
  const processingDurationMs = now.getTime() - processingStartedAt.getTime();
  
  return {
    ...metadata,
    status: EventProcessingStatus.COMPLETED,
    processingCompletedAt: now.toISOString(),
    processingDurationMs,
    attemptCount: metadata.attemptCount + 1
  };
}

/**
 * Updates processing metadata for a failed event
 * @param metadata Current processing metadata
 * @param error Error that occurred
 * @param retryPolicy Retry policy to use
 * @returns Updated processing metadata
 */
export function markEventProcessingFailure(
  metadata: IEventProcessingMetadata,
  error: Error,
  retryPolicy?: IRetryPolicy
): IEventProcessingMetadata {
  const now = new Date();
  const nextAttempt = metadata.attemptCount + 1;
  const maxAttempts = retryPolicy?.maxAttempts || metadata.maxAttempts;
  
  // Determine if we should retry or mark as terminal failure
  const shouldRetry = nextAttempt < maxAttempts;
  const status = shouldRetry ? EventProcessingStatus.FAILED_RETRYING : EventProcessingStatus.FAILED_TERMINAL;
  
  // Calculate next retry delay if applicable
  let nextRetryDelayMs: number | undefined;
  let nextRetryAt: string | undefined;
  
  if (shouldRetry && retryPolicy) {
    nextRetryDelayMs = retryPolicy.calculateDelay({
      attemptCount: metadata.attemptCount,
      maxAttempts,
      firstAttemptTimestamp: metadata.processingStartedAt || now.toISOString(),
      lastAttemptTimestamp: now.toISOString(),
      nextRetryDelayMs: 0
    });
    
    const nextRetryDate = new Date(now.getTime() + nextRetryDelayMs);
    nextRetryAt = nextRetryDate.toISOString();
  }
  
  return {
    ...metadata,
    status,
    error: {
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
      timestamp: now.toISOString()
    },
    attemptCount: nextAttempt,
    nextRetryDelayMs,
    nextRetryAt,
    retryPolicy: retryPolicy || metadata.retryPolicy
  };
}

/**
 * Updates processing metadata for an event sent to the dead letter queue
 * @param metadata Current processing metadata
 * @returns Updated processing metadata
 */
export function markEventSentToDlq(metadata: IEventProcessingMetadata): IEventProcessingMetadata {
  return {
    ...metadata,
    status: EventProcessingStatus.DEAD_LETTER,
    sentToDlq: true,
    sentToDlqAt: new Date().toISOString()
  };
}

/**
 * Creates a retry context from event metadata
 * @param metadata Event metadata
 * @param operation Operation being retried
 * @returns Retry context for use with retry handlers
 */
export function createRetryContextFromMetadata(
  metadata: IEventMetadata,
  operation: string
): IRetryContext {
  return {
    correlationId: metadata.tracking.correlationId,
    userId: metadata.tracking.userId,
    journeyType: metadata.source.journey,
    operation,
    metadata: {
      eventId: metadata.tracking.eventId,
      source: metadata.source.source,
      ...(metadata.context?.businessContext || {})
    }
  };
}

/**
 * Extracts metadata from an event object
 * @param event Event object with metadata property
 * @returns Extracted metadata or undefined if not present
 */
export function extractEventMetadata<T extends { metadata?: IEventMetadata }>(event: T): IEventMetadata | undefined {
  return event.metadata;
}

/**
 * Type for an event with required metadata
 */
export type EventWithMetadata<T> = T & {
  metadata: IEventMetadata;
};

/**
 * Type for an event with required processing metadata
 */
export type ProcessedEventWithMetadata<T> = T & {
  metadata: IProcessedEventMetadata;
};

/**
 * Type guard to check if an event has metadata
 * @param event The event to check
 * @returns True if the event has metadata
 */
export function hasEventMetadata<T>(event: T): event is EventWithMetadata<T> {
  return !!event && typeof event === 'object' && 'metadata' in event;
}

/**
 * Type guard to check if an event has processing metadata
 * @param event The event to check
 * @returns True if the event has processing metadata
 */
export function hasProcessedEventMetadata<T>(event: T): event is ProcessedEventWithMetadata<T> {
  return hasEventMetadata(event) && hasProcessingMetadata(event.metadata);
}

/**
 * Adds metadata to an event object
 * @param event Event object
 * @param metadata Metadata to add
 * @returns Event with added metadata
 */
export function addMetadataToEvent<T>(event: T, metadata: IEventMetadata): EventWithMetadata<T> {
  return {
    ...event,
    metadata
  };
}

/**
 * Adds processing metadata to an event object
 * @param event Event object with metadata
 * @param processingMetadata Processing metadata to add
 * @returns Event with added processing metadata
 */
export function addProcessingMetadataToEvent<T>(
  event: EventWithMetadata<T>,
  processingMetadata: IEventProcessingMetadata
): ProcessedEventWithMetadata<T> {
  return {
    ...event,
    metadata: {
      ...event.metadata,
      processing: processingMetadata
    }
  };
}

/**
 * Updates the processing metadata of an event
 * @param event Event with processing metadata
 * @param updateFn Function to update the processing metadata
 * @returns Event with updated processing metadata
 */
export function updateEventProcessingMetadata<T>(
  event: ProcessedEventWithMetadata<T>,
  updateFn: (metadata: IEventProcessingMetadata) => IEventProcessingMetadata
): ProcessedEventWithMetadata<T> {
  return {
    ...event,
    metadata: {
      ...event.metadata,
      processing: updateFn(event.metadata.processing)
    }
  };
}

/**
 * Merges multiple metadata objects into one
 * @param metadataObjects Array of metadata objects to merge
 * @returns Merged metadata object
 */
export function mergeEventMetadata(...metadataObjects: IEventMetadata[]): IEventMetadata {
  if (metadataObjects.length === 0) {
    throw new Error('At least one metadata object must be provided');
  }
  
  if (metadataObjects.length === 1) {
    return metadataObjects[0];
  }
  
  // Start with the first metadata object
  const result = { ...metadataObjects[0] };
  
  // Merge the rest of the metadata objects
  for (let i = 1; i < metadataObjects.length; i++) {
    const metadata = metadataObjects[i];
    
    // Merge source metadata
    result.source = { ...result.source, ...metadata.source };
    
    // Merge tracking metadata (prefer the first object's values for IDs)
    result.tracking = {
      ...metadata.tracking,
      eventId: result.tracking.eventId,
      userId: result.tracking.userId,
      correlationId: result.tracking.correlationId || metadata.tracking.correlationId
    };
    
    // Merge version metadata (prefer the highest version)
    if (metadata.version) {
      const currentVersion = result.version.schemaVersion;
      const newVersion = metadata.version.schemaVersion;
      
      // Use the higher version
      if (
        newVersion.major > currentVersion.major ||
        (newVersion.major === currentVersion.major && newVersion.minor > currentVersion.minor) ||
        (newVersion.major === currentVersion.major && 
         newVersion.minor === currentVersion.minor && 
         newVersion.patch > currentVersion.patch)
      ) {
        result.version = { ...metadata.version };
      }
    }
    
    // Merge processing metadata if present
    if (metadata.processing) {
      result.processing = result.processing 
        ? { ...result.processing, ...metadata.processing }
        : { ...metadata.processing };
    }
    
    // Merge context metadata if present
    if (metadata.context) {
      result.context = result.context 
        ? {
            ...result.context,
            businessContext: { 
              ...(result.context.businessContext || {}), 
              ...(metadata.context.businessContext || {}) 
            },
            technicalContext: { 
              ...(result.context.technicalContext || {}), 
              ...(metadata.context.technicalContext || {}) 
            },
            featureFlags: { 
              ...(result.context.featureFlags || {}), 
              ...(metadata.context.featureFlags || {}) 
            },
            tags: [...(result.context.tags || []), ...(metadata.context.tags || [])],
            journeyContext: metadata.context.journeyContext || result.context.journeyContext
          }
        : { ...metadata.context };
    }
  }
  
  return result;
}
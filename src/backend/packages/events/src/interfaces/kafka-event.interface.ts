/**
 * Defines interfaces specific to Kafka-based event messaging.
 * These interfaces extend the base event with Kafka-specific properties
 * to support reliable event delivery and consumption via Kafka.
 */

import { IBaseEvent } from './base-event.interface';

/**
 * Represents Kafka message headers for metadata.
 * Headers are key-value pairs used for message routing, tracing, and other metadata.
 */
export interface KafkaHeaders {
  [key: string]: string;
}

/**
 * Extends the base event with Kafka-specific properties.
 * This interface provides the necessary structure for reliable event delivery
 * and consumption via Kafka, supporting the event-driven architecture.
 */
export interface KafkaEvent<T = any> extends IBaseEvent<T> {
  /**
   * The Kafka topic the event was published to.
   * Used for routing events to appropriate consumers.
   */
  topic: string;

  /**
   * The Kafka partition the event was published to.
   * Used for parallel processing and ordering guarantees.
   */
  partition?: number;

  /**
   * The Kafka offset of the event within its partition.
   * Used for tracking consumption progress and exactly-once processing.
   */
  offset?: string;

  /**
   * The Kafka message key used for partitioning.
   * Events with the same key are guaranteed to be processed in order.
   */
  key?: string;

  /**
   * Kafka message headers for metadata.
   * Used for tracing, routing, and other cross-cutting concerns.
   */
  headers?: KafkaHeaders;
}

/**
 * Configuration options for Kafka event production.
 * Used when publishing events to Kafka topics.
 */
export interface KafkaEventProducerOptions {
  /**
   * The Kafka topic to publish the event to.
   */
  topic: string;

  /**
   * Optional key for the Kafka message.
   * Used for partitioning and ordering guarantees.
   */
  key?: string;

  /**
   * Optional headers for the Kafka message.
   * Used for metadata and cross-cutting concerns.
   */
  headers?: KafkaHeaders;

  /**
   * Optional partition for the Kafka message.
   * If specified, the message will be sent to this partition.
   */
  partition?: number;

  /**
   * Whether to wait for acknowledgment from all replicas.
   * Default is true for reliable delivery.
   */
  requireAcks?: boolean;
}

/**
 * Configuration options for Kafka event consumption.
 * Used when subscribing to Kafka topics.
 */
export interface KafkaEventConsumerOptions {
  /**
   * The Kafka topic to subscribe to.
   */
  topic: string;

  /**
   * The consumer group ID for this consumer.
   * Used for load balancing and offset tracking.
   */
  groupId: string;

  /**
   * Whether to start consuming from the beginning of the topic.
   * Default is false (start from latest).
   */
  fromBeginning?: boolean;

  /**
   * Maximum number of messages to process in parallel.
   * Default is 1 for ordered processing.
   */
  concurrency?: number;

  /**
   * Retry configuration for failed message processing.
   */
  retry?: {
    /**
     * Maximum number of retries before sending to dead letter queue.
     */
    maxRetries: number;

    /**
     * Initial retry delay in milliseconds.
     */
    initialRetryTime: number;

    /**
     * Factor to multiply delay by for each retry (exponential backoff).
     */
    backoffFactor: number;
  };

  /**
   * Dead letter queue configuration for failed messages.
   */
  deadLetterQueue?: {
    /**
     * Topic to send failed messages to after max retries.
     */
    topic: string;

    /**
     * Whether to include error details in the dead letter message.
     */
    includeErrorDetails: boolean;
  };
}

/**
 * Utility type for converting a base event to a Kafka event.
 * Used for type-safe conversion between application events and Kafka messages.
 */
export type ToKafkaEvent<T extends IBaseEvent> = KafkaEvent<T['payload']>;

/**
 * Utility type for extracting the payload type from a Kafka event.
 * Used for type-safe access to event payloads.
 */
export type KafkaEventPayload<T extends KafkaEvent> = T['payload'];
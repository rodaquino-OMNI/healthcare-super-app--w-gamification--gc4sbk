/**
 * Interface definitions for Kafka-specific event messaging.
 * Extends the base event interface with Kafka-specific properties.
 */

import { BaseEvent } from './base-event.interface';

/**
 * Represents Kafka message headers which are key-value pairs
 * used for metadata in Kafka messages.
 */
export interface KafkaHeaders {
  [key: string]: string;
}

/**
 * Represents a Kafka-specific event with properties required for
 * reliable event delivery and consumption via Kafka.
 */
export interface KafkaEvent<T = any> extends BaseEvent<T> {
  /**
   * The Kafka topic this event was published to or consumed from.
   */
  topic: string;

  /**
   * The Kafka partition this event was published to or consumed from.
   */
  partition: number;

  /**
   * The offset of this event in the Kafka partition.
   * Used for tracking consumption progress and enabling replay capabilities.
   */
  offset: number;

  /**
   * Optional key used for partitioning in Kafka.
   * Messages with the same key will be sent to the same partition.
   */
  key?: string;

  /**
   * Headers containing metadata for the Kafka message.
   * Can include correlation IDs, tracing information, etc.
   */
  headers?: KafkaHeaders;
}

/**
 * Configuration options for producing Kafka events.
 */
export interface KafkaProducerOptions {
  /**
   * The Kafka topic to produce the event to.
   */
  topic: string;

  /**
   * Optional partition to produce the event to.
   * If not specified, Kafka will determine the partition based on the key.
   */
  partition?: number;

  /**
   * Optional key for the Kafka message.
   * Messages with the same key will be sent to the same partition.
   */
  key?: string;

  /**
   * Optional headers for the Kafka message.
   */
  headers?: KafkaHeaders;

  /**
   * Optional compression type for the Kafka message.
   */
  compression?: 'none' | 'gzip' | 'snappy' | 'lz4';

  /**
   * Optional acknowledgment level for the Kafka message.
   * 0 = No acknowledgment
   * 1 = Leader acknowledgment only
   * -1 = All replicas acknowledgment
   */
  acks?: 0 | 1 | -1;
}

/**
 * Configuration options for consuming Kafka events.
 */
export interface KafkaConsumerOptions {
  /**
   * The Kafka topic to consume events from.
   */
  topic: string;

  /**
   * The consumer group ID for this consumer.
   * Consumers with the same group ID will share the consumption load.
   */
  groupId: string;

  /**
   * Optional flag to indicate whether to start consuming from the beginning of the topic.
   * If false, will start consuming from the latest offset.
   */
  fromBeginning?: boolean;

  /**
   * Optional specific partition to consume from.
   * If not specified, will consume from all partitions of the topic.
   */
  partition?: number;

  /**
   * Optional auto-commit configuration.
   * If true, offsets will be committed automatically at regular intervals.
   */
  autoCommit?: boolean;

  /**
   * Optional auto-commit interval in milliseconds.
   * Only applicable if autoCommit is true.
   */
  autoCommitInterval?: number;

  /**
   * Optional session timeout in milliseconds.
   * If the consumer doesn't send heartbeats within this timeout, it will be considered dead.
   */
  sessionTimeout?: number;
}

/**
 * Utility type for converting a BaseEvent to a KafkaEvent.
 */
export type ToKafkaEvent<T extends BaseEvent<any>> = KafkaEvent<T['payload']> & Omit<T, 'payload'>;

/**
 * Utility type for converting a KafkaEvent back to a BaseEvent.
 */
export type FromKafkaEvent<T extends KafkaEvent<any>> = BaseEvent<T['payload']> & Omit<T, 'topic' | 'partition' | 'offset' | 'key' | 'headers'>;
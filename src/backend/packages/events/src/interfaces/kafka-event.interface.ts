/**
 * @file Kafka Event Interface
 * @description Defines interfaces specific to Kafka-based event messaging.
 * These interfaces extend the base event with Kafka-specific properties
 * to support the event-driven architecture of the application.
 */

import { IBaseEvent } from './base-event.interface';

/**
 * Interface for Kafka message headers
 * Represents the metadata associated with a Kafka message
 */
export interface IKafkaHeaders {
  [key: string]: string;
}

/**
 * Interface for Kafka-specific event properties
 * Contains the Kafka-specific metadata for an event
 */
export interface IKafkaMetadata {
  /** The Kafka topic this event was published to or consumed from */
  topic: string;
  
  /** The Kafka partition this event was published to or consumed from */
  partition: number;
  
  /** The offset of this event in the Kafka partition */
  offset: number;
  
  /** Optional key used for partitioning or message identification */
  key?: string;
  
  /** Headers containing metadata for the Kafka message */
  headers?: IKafkaHeaders;
}

/**
 * Interface for Kafka events
 * Extends the base event with Kafka-specific properties
 * @template T - The type of the event payload
 */
export interface IKafkaEvent<T = unknown> extends IBaseEvent<T> {
  /** Kafka-specific metadata for the event */
  kafka: IKafkaMetadata;
}

/**
 * Type guard to check if an event is a Kafka event
 * @param event - The event to check
 * @returns True if the event is a Kafka event
 */
export function isKafkaEvent<T = unknown>(event: IBaseEvent<T>): event is IKafkaEvent<T> {
  return 'kafka' in event && 
    typeof (event as IKafkaEvent<T>).kafka === 'object' &&
    'topic' in (event as IKafkaEvent<T>).kafka;
}

/**
 * Options for converting a base event to a Kafka event
 */
export interface IToKafkaEventOptions {
  /** The Kafka topic to publish the event to */
  topic: string;
  
  /** Optional partition to publish the event to */
  partition?: number;
  
  /** Optional key for the Kafka message */
  key?: string;
  
  /** Optional headers for the Kafka message */
  headers?: IKafkaHeaders;
}

/**
 * Converts a base event to a Kafka event
 * @param event - The base event to convert
 * @param options - Options for the Kafka event
 * @returns A Kafka event with the specified options
 */
export function toKafkaEvent<T = unknown>(
  event: IBaseEvent<T>,
  options: IToKafkaEventOptions
): IKafkaEvent<T> {
  return {
    ...event,
    kafka: {
      topic: options.topic,
      partition: options.partition ?? 0,
      offset: -1, // Will be set by Kafka when consumed
      key: options.key,
      headers: options.headers
    }
  };
}

/**
 * Extracts a base event from a Kafka event
 * @param kafkaEvent - The Kafka event to extract from
 * @returns The base event without Kafka-specific properties
 */
export function fromKafkaEvent<T = unknown>(kafkaEvent: IKafkaEvent<T>): IBaseEvent<T> {
  // Destructure to remove the kafka property
  const { kafka, ...baseEvent } = kafkaEvent;
  return baseEvent as IBaseEvent<T>;
}
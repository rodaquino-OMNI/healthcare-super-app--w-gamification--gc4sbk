/**
 * Mock Kafka Message Factory
 * 
 * This file provides factory functions for creating KafkaJS-compatible message objects
 * for testing purposes. These mock messages can be used for both producer and consumer testing.
 */

import { randomUUID } from 'crypto';

/**
 * Interface for Kafka message headers
 */
export interface IHeaders {
  [key: string]: Buffer | string | undefined;
}

/**
 * Interface for a Kafka message
 */
export interface KafkaMessage {
  key?: Buffer | string | null;
  value: Buffer | string | null;
  partition?: number;
  offset?: string;
  timestamp?: string;
  size?: number;
  attributes?: number;
  headers?: IHeaders;
}

/**
 * Interface for a batch of Kafka messages
 */
export interface KafkaBatch {
  topic: string;
  partition: number;
  highWatermark?: string;
  messages: KafkaMessage[];
}

/**
 * Interface for a Kafka message with error information
 */
export interface KafkaMessageWithError extends KafkaMessage {
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Creates a basic Kafka message with default values
 * 
 * @param value - The message value
 * @param key - Optional message key
 * @returns A KafkaJS-compatible message object
 */
export function createMockMessage(value: string | Buffer | null, key?: string | Buffer | null): KafkaMessage {
  return {
    key: key || null,
    value: value,
    timestamp: new Date().toISOString(),
    offset: '0',
    size: typeof value === 'string' ? Buffer.from(value).length : (value ? value.length : 0),
    attributes: 0,
    headers: {},
  };
}

/**
 * Creates a Kafka message with specified headers
 * 
 * @param value - The message value
 * @param headers - Message headers as key-value pairs
 * @param key - Optional message key
 * @returns A KafkaJS-compatible message object with headers
 */
export function createMockMessageWithHeaders(
  value: string | Buffer | null,
  headers: Record<string, string | Buffer>,
  key?: string | Buffer | null
): KafkaMessage {
  return {
    ...createMockMessage(value, key),
    headers: headers,
  };
}

/**
 * Creates a Kafka message with tracing information in headers
 * 
 * @param value - The message value
 * @param key - Optional message key
 * @param traceId - Optional trace ID (generates a random UUID if not provided)
 * @param spanId - Optional span ID (generates a random UUID if not provided)
 * @returns A KafkaJS-compatible message object with tracing headers
 */
export function createMockMessageWithTracing(
  value: string | Buffer | null,
  key?: string | Buffer | null,
  traceId?: string,
  spanId?: string
): KafkaMessage {
  const actualTraceId = traceId || randomUUID();
  const actualSpanId = spanId || randomUUID();
  
  return createMockMessageWithHeaders(
    value,
    {
      'x-trace-id': actualTraceId,
      'x-span-id': actualSpanId,
      'x-timestamp': new Date().toISOString(),
    },
    key
  );
}

/**
 * Creates a batch of Kafka messages
 * 
 * @param topic - The Kafka topic
 * @param partition - The partition number
 * @param messages - Array of message values
 * @param keys - Optional array of message keys (must match messages length if provided)
 * @returns A KafkaJS-compatible batch object
 */
export function createMockBatch(
  topic: string,
  partition: number,
  messages: (string | Buffer | null)[],
  keys?: (string | Buffer | null)[]
): KafkaBatch {
  return {
    topic,
    partition,
    highWatermark: String(messages.length),
    messages: messages.map((value, index) => {
      const key = keys ? keys[index] : null;
      return createMockMessage(value, key);
    }),
  };
}

/**
 * Creates a batch of Kafka messages with tracing information
 * 
 * @param topic - The Kafka topic
 * @param partition - The partition number
 * @param messages - Array of message values
 * @param keys - Optional array of message keys
 * @returns A KafkaJS-compatible batch object with tracing headers
 */
export function createMockBatchWithTracing(
  topic: string,
  partition: number,
  messages: (string | Buffer | null)[],
  keys?: (string | Buffer | null)[]
): KafkaBatch {
  const traceId = randomUUID(); // Same trace ID for all messages in batch
  
  return {
    topic,
    partition,
    highWatermark: String(messages.length),
    messages: messages.map((value, index) => {
      const key = keys ? keys[index] : null;
      const spanId = randomUUID(); // Unique span ID for each message
      return createMockMessageWithTracing(value, key, traceId, spanId);
    }),
  };
}

/**
 * Creates a Kafka message with error information
 * 
 * @param value - The message value
 * @param errorCode - The error code
 * @param errorMessage - The error message
 * @param key - Optional message key
 * @returns A KafkaJS-compatible message object with error information
 */
export function createMockMessageWithError(
  value: string | Buffer | null,
  errorCode: number,
  errorMessage: string,
  key?: string | Buffer | null
): KafkaMessageWithError {
  return {
    ...createMockMessage(value, key),
    errorCode,
    errorMessage,
  };
}

/**
 * Creates a serialized JSON Kafka message
 * 
 * @param data - The data object to serialize
 * @param key - Optional message key
 * @returns A KafkaJS-compatible message with JSON serialized value
 */
export function createMockJsonMessage<T>(
  data: T,
  key?: string | Buffer | null
): KafkaMessage {
  return createMockMessage(JSON.stringify(data), key);
}

/**
 * Creates a serialized JSON Kafka message with schema version in headers
 * 
 * @param data - The data object to serialize
 * @param schemaVersion - The schema version
 * @param key - Optional message key
 * @returns A KafkaJS-compatible message with JSON serialized value and schema version header
 */
export function createMockVersionedJsonMessage<T>(
  data: T,
  schemaVersion: string,
  key?: string | Buffer | null
): KafkaMessage {
  return createMockMessageWithHeaders(
    JSON.stringify(data),
    { 'schema-version': schemaVersion },
    key
  );
}

/**
 * Deserializes a mock Kafka message value as JSON
 * 
 * @param message - The Kafka message
 * @returns The deserialized JSON object
 */
export function deserializeMockJsonMessage<T>(message: KafkaMessage): T {
  if (!message.value) {
    throw new Error('Message value is null or undefined');
  }
  
  const valueStr = typeof message.value === 'string' 
    ? message.value 
    : message.value.toString('utf-8');
  
  return JSON.parse(valueStr) as T;
}

/**
 * Creates a mock Kafka message for a specific journey
 * 
 * @param journey - The journey name ('health', 'care', or 'plan')
 * @param eventType - The event type
 * @param payload - The event payload
 * @param userId - The user ID
 * @returns A KafkaJS-compatible message for the specified journey
 */
export function createMockJourneyMessage(
  journey: 'health' | 'care' | 'plan',
  eventType: string,
  payload: Record<string, any>,
  userId: string
): KafkaMessage {
  const eventData = {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    type: eventType,
    journey,
    userId,
    payload,
  };
  
  return createMockMessageWithHeaders(
    JSON.stringify(eventData),
    {
      'x-journey': journey,
      'x-event-type': eventType,
      'x-user-id': userId,
    },
    userId
  );
}

/**
 * Creates a mock Kafka message that will fail schema validation
 * 
 * @param journey - The journey name
 * @param eventType - The event type
 * @param missingFields - Fields to omit from the standard schema
 * @returns A KafkaJS-compatible message that will fail schema validation
 */
export function createMockInvalidSchemaMessage(
  journey: 'health' | 'care' | 'plan',
  eventType: string,
  missingFields: string[]
): KafkaMessage {
  const eventData: Record<string, any> = {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    type: eventType,
    journey,
    userId: randomUUID(),
    payload: {},
  };
  
  // Remove specified fields to make the message invalid
  for (const field of missingFields) {
    delete eventData[field];
  }
  
  return createMockMessage(JSON.stringify(eventData));
}
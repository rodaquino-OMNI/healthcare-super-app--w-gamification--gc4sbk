/**
 * Factory functions for creating mock Kafka messages with appropriate structure for testing.
 * This file provides utilities to generate KafkaJS-compatible message objects with headers,
 * key, value, topic, partition, and timestamp. These mock messages can be used for both
 * producer and consumer testing.
 */

import { randomUUID } from 'crypto';
import { mockJsonSerializer } from './mock-serializers';

/**
 * Interface representing a KafkaJS message header
 */
export interface KafkaMessageHeaders {
  [key: string]: Buffer;
}

/**
 * Interface representing a KafkaJS message
 */
export interface KafkaMessage {
  /** Message key */
  key: Buffer | string | null;
  /** Message value/payload */
  value: Buffer | string | null;
  /** Message headers as key-value pairs */
  headers: KafkaMessageHeaders;
  /** Topic the message belongs to */
  topic?: string;
  /** Partition number */
  partition?: number;
  /** Message timestamp in milliseconds */
  timestamp?: string;
  /** Message offset in the partition */
  offset?: string;
  /** Whether this is a control record */
  isControlRecord?: boolean;
  /** Message attributes */
  attributes?: number;
  /** Kafka protocol version indicator */
  magicByte?: number;
  /** Batch context for the message */
  batchContext?: Record<string, any>;
}

/**
 * Interface for batch context information
 */
export interface BatchContext {
  /** First timestamp in the batch */
  firstTimestamp: string;
  /** Maximum timestamp in the batch */
  maxTimestamp: string;
  /** Producer ID */
  producerId: string;
  /** Producer epoch */
  producerEpoch: number;
  /** First sequence in the batch */
  firstSequence: number;
  /** Base sequence */
  baseSequence: number;
  /** Batch size */
  batchSize: number;
  /** Partition leader epoch */
  partitionLeaderEpoch: number;
  /** Whether the batch is a control batch */
  isControlBatch: boolean;
}

/**
 * Options for creating mock Kafka messages
 */
export interface MockKafkaMessageOptions {
  /** Message key */
  key?: Buffer | string | null;
  /** Message value/payload */
  value?: Buffer | string | null;
  /** Message headers */
  headers?: Record<string, string | Buffer>;
  /** Topic the message belongs to */
  topic?: string;
  /** Partition number */
  partition?: number;
  /** Message timestamp in milliseconds */
  timestamp?: string | number;
  /** Message offset in the partition */
  offset?: string | number;
  /** Whether to include tracing information in headers */
  includeTracing?: boolean;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Whether this is a control record */
  isControlRecord?: boolean;
  /** Message attributes */
  attributes?: number;
  /** Kafka protocol version indicator */
  magicByte?: number;
  /** Batch context for the message */
  batchContext?: Partial<BatchContext>;
}

/**
 * Default options for mock Kafka messages
 */
const DEFAULT_MESSAGE_OPTIONS: MockKafkaMessageOptions = {
  key: null,
  value: null,
  headers: {},
  topic: 'test-topic',
  partition: 0,
  timestamp: Date.now().toString(),
  offset: '0',
  includeTracing: true,
  correlationId: randomUUID(),
  isControlRecord: false,
  attributes: 0,
  magicByte: 2,
};

/**
 * Creates a mock Kafka message with the specified options
 * 
 * @param options - Options for the mock message
 * @returns A KafkaJS-compatible message object
 */
export function createMockKafkaMessage(options: MockKafkaMessageOptions = {}): KafkaMessage {
  const opts = { ...DEFAULT_MESSAGE_OPTIONS, ...options };
  
  // Convert timestamp to string if it's a number
  if (typeof opts.timestamp === 'number') {
    opts.timestamp = opts.timestamp.toString();
  }
  
  // Convert offset to string if it's a number
  if (typeof opts.offset === 'number') {
    opts.offset = opts.offset.toString();
  }
  
  // Convert header values to Buffer
  const headers: KafkaMessageHeaders = {};
  if (opts.headers) {
    for (const [key, value] of Object.entries(opts.headers)) {
      headers[key] = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
    }
  }
  
  // Add tracing information to headers if requested
  if (opts.includeTracing) {
    const correlationId = opts.correlationId || randomUUID();
    headers['correlation-id'] = Buffer.from(correlationId, 'utf8');
    headers['trace-id'] = Buffer.from(randomUUID(), 'utf8');
    headers['span-id'] = Buffer.from(randomUUID(), 'utf8');
    headers['timestamp'] = Buffer.from(Date.now().toString(), 'utf8');
  }
  
  // Create batch context if not provided
  const batchContext: BatchContext = {
    firstTimestamp: opts.timestamp || Date.now().toString(),
    maxTimestamp: opts.timestamp || Date.now().toString(),
    producerId: '1',
    producerEpoch: 0,
    firstSequence: 0,
    baseSequence: 0,
    batchSize: 1,
    partitionLeaderEpoch: 0,
    isControlBatch: false,
    ...opts.batchContext,
  };
  
  return {
    key: opts.key,
    value: opts.value,
    headers,
    topic: opts.topic,
    partition: opts.partition,
    timestamp: opts.timestamp,
    offset: opts.offset,
    isControlRecord: opts.isControlRecord,
    attributes: opts.attributes,
    magicByte: opts.magicByte,
    batchContext,
  };
}

/**
 * Creates a mock Kafka message with a string key and value
 * 
 * @param key - The message key
 * @param value - The message value
 * @param options - Additional options for the mock message
 * @returns A KafkaJS-compatible message object
 */
export function createMockStringMessage(
  key: string,
  value: string,
  options: MockKafkaMessageOptions = {}
): KafkaMessage {
  return createMockKafkaMessage({
    key,
    value,
    ...options,
  });
}

/**
 * Creates a mock Kafka message with a JSON object as the value
 * 
 * @param value - The JSON object to use as the message value
 * @param options - Additional options for the mock message
 * @returns A KafkaJS-compatible message object with serialized JSON value
 */
export function createMockJsonMessage<T = Record<string, any>>(
  value: T,
  options: MockKafkaMessageOptions = {}
): KafkaMessage {
  const serialized = JSON.stringify(value);
  return createMockKafkaMessage({
    value: serialized,
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options,
  });
}

/**
 * Creates a mock Kafka message with a serialized value using the provided serializer
 * 
 * @param value - The value to serialize
 * @param options - Additional options for the mock message
 * @returns A KafkaJS-compatible message object with serialized value
 */
export function createMockSerializedMessage<T = Record<string, any>>(
  value: T,
  options: MockKafkaMessageOptions = {}
): KafkaMessage {
  const serializationResult = mockJsonSerializer(value);
  
  if (!serializationResult.success || !serializationResult.data) {
    throw new Error(`Failed to serialize message: ${serializationResult.error}`);
  }
  
  return createMockKafkaMessage({
    value: serializationResult.data,
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options,
  });
}

/**
 * Creates a batch of mock Kafka messages
 * 
 * @param count - The number of messages to create
 * @param baseOptions - Base options for all messages in the batch
 * @param valueGenerator - Function to generate values for each message
 * @returns An array of KafkaJS-compatible message objects
 */
export function createMockMessageBatch(
  count: number,
  baseOptions: MockKafkaMessageOptions = {},
  valueGenerator?: (index: number) => any
): KafkaMessage[] {
  const messages: KafkaMessage[] = [];
  const batchId = randomUUID();
  const timestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    const value = valueGenerator ? valueGenerator(i) : `message-${i}`;
    
    messages.push(
      createMockKafkaMessage({
        ...baseOptions,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        offset: (baseOptions.offset ? Number(baseOptions.offset) : 0) + i,
        timestamp: timestamp + i,
        headers: {
          ...baseOptions.headers,
          'batch-id': batchId,
          'batch-index': i.toString(),
        },
      })
    );
  }
  
  return messages;
}

/**
 * Creates a mock Kafka message with a binary (Buffer) value
 * 
 * @param value - The binary data to use as the message value
 * @param options - Additional options for the mock message
 * @returns A KafkaJS-compatible message object with binary value
 */
export function createMockBinaryMessage(
  value: Buffer | Uint8Array,
  options: MockKafkaMessageOptions = {}
): KafkaMessage {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  
  return createMockKafkaMessage({
    value: buffer,
    headers: { 'content-type': 'application/octet-stream', ...options.headers },
    ...options,
  });
}

/**
 * Creates a mock Kafka message for testing error scenarios
 * 
 * @param errorType - The type of error to simulate
 * @param options - Additional options for the mock message
 * @returns A KafkaJS-compatible message object configured for the error scenario
 */
export function createMockErrorMessage(
  errorType: 'invalid-key' | 'invalid-value' | 'missing-required-header' | 'corrupt-data' | 'schema-validation',
  options: MockKafkaMessageOptions = {}
): KafkaMessage {
  switch (errorType) {
    case 'invalid-key':
      return createMockKafkaMessage({
        key: Buffer.from([0xFF, 0xFE, 0xFD]), // Invalid UTF-8 sequence
        value: 'test-value',
        ...options,
      });
      
    case 'invalid-value':
      return createMockKafkaMessage({
        key: 'test-key',
        value: Buffer.from([0xFF, 0xFE, 0xFD]), // Invalid UTF-8 sequence
        ...options,
      });
      
    case 'missing-required-header':
      // Create message without tracing headers
      return createMockKafkaMessage({
        key: 'test-key',
        value: 'test-value',
        includeTracing: false,
        ...options,
      });
      
    case 'corrupt-data':
      // Create message with corrupt JSON
      return createMockKafkaMessage({
        key: 'test-key',
        value: '{"corrupted":true,',
        headers: { 'content-type': 'application/json', ...options.headers },
        ...options,
      });
      
    case 'schema-validation':
      // Create message that will fail schema validation
      return createMockKafkaMessage({
        key: 'test-key',
        value: JSON.stringify({ invalidField: 'value' }),
        headers: { 
          'content-type': 'application/json', 
          'schema-version': '1.0.0',
          ...options.headers 
        },
        ...options,
      });
      
    default:
      throw new Error(`Unknown error type: ${errorType}`);
  }
}

/**
 * Creates a mock Kafka message with journey-specific event data
 * 
 * @param journey - The journey identifier
 * @param eventType - The type of event
 * @param eventData - The event data
 * @param options - Additional options for the mock message
 * @returns A KafkaJS-compatible message object with journey event data
 */
export function createMockJourneyEventMessage(
  journey: 'health' | 'care' | 'plan',
  eventType: string,
  eventData: Record<string, any>,
  options: MockKafkaMessageOptions = {}
): KafkaMessage {
  const eventPayload = {
    id: randomUUID(),
    type: eventType,
    userId: options.headers?.['user-id'] ? options.headers['user-id'].toString() : randomUUID(),
    timestamp: new Date().toISOString(),
    journey,
    version: '1.0.0',
    data: eventData,
  };
  
  return createMockJsonMessage(eventPayload, {
    topic: `${journey}-events`,
    headers: {
      'event-type': eventType,
      'journey': journey,
      ...options.headers,
    },
    ...options,
  });
}

/**
 * Creates a mock Kafka message with versioned event data for backward compatibility testing
 * 
 * @param journey - The journey identifier
 * @param eventType - The type of event
 * @param eventData - The event data
 * @param version - The event schema version
 * @param options - Additional options for the mock message
 * @returns A KafkaJS-compatible message object with versioned event data
 */
export function createMockVersionedEventMessage(
  journey: 'health' | 'care' | 'plan',
  eventType: string,
  eventData: Record<string, any>,
  version: string,
  options: MockKafkaMessageOptions = {}
): KafkaMessage {
  const eventPayload = {
    id: randomUUID(),
    type: eventType,
    userId: options.headers?.['user-id'] ? options.headers['user-id'].toString() : randomUUID(),
    timestamp: new Date().toISOString(),
    journey,
    version,
    data: eventData,
  };
  
  return createMockJsonMessage(eventPayload, {
    topic: `${journey}-events`,
    headers: {
      'event-type': eventType,
      'journey': journey,
      'schema-version': version,
      ...options.headers,
    },
    ...options,
  });
}

/**
 * Creates a mock Kafka message with tracing context for distributed tracing testing
 * 
 * @param parentTraceId - The parent trace ID
 * @param parentSpanId - The parent span ID
 * @param options - Additional options for the mock message
 * @returns A KafkaJS-compatible message object with tracing context
 */
export function createMockTracedMessage(
  parentTraceId: string,
  parentSpanId: string,
  options: MockKafkaMessageOptions = {}
): KafkaMessage {
  const spanId = randomUUID();
  
  return createMockKafkaMessage({
    ...options,
    includeTracing: false, // We'll add our own tracing headers
    headers: {
      'trace-id': parentTraceId,
      'parent-span-id': parentSpanId,
      'span-id': spanId,
      'sampled': '1',
      'timestamp': Date.now().toString(),
      ...options.headers,
    },
  });
}
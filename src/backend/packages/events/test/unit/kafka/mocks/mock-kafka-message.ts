/**
 * @file mock-kafka-message.ts
 * @description Factory functions for creating mock Kafka messages with appropriate structure for testing.
 * This file provides utilities to generate KafkaJS-compatible message objects with headers, key, value,
 * topic, partition, and timestamp. These mock messages can be used for both producer and consumer testing.
 */

import { KafkaHeaders, KafkaMessage } from '../../../../src/kafka/kafka.types';
import { BaseEvent, EventMetadata } from '../../../../src/interfaces/base-event.interface';
import { IVersionedEvent } from '../../../../src/interfaces/event-versioning.interface';

/**
 * Options for creating a mock Kafka message
 */
export interface MockKafkaMessageOptions<T = unknown> {
  /** The topic this message belongs to */
  topic?: string;
  /** The partition this message belongs to */
  partition?: number;
  /** The message key */
  key?: string | Buffer | null;
  /** The message value */
  value?: T | string | Buffer | null;
  /** The message headers */
  headers?: KafkaHeaders;
  /** The message timestamp */
  timestamp?: string;
  /** The message offset in the partition */
  offset?: string;
  /** Whether to serialize the value as JSON */
  serializeValue?: boolean;
}

/**
 * Creates a mock Kafka message with the specified options
 * 
 * @param options Options for creating the mock message
 * @returns A KafkaJS-compatible message object
 */
export function createMockKafkaMessage<T = unknown>(options: MockKafkaMessageOptions<T> = {}): KafkaMessage<T> {
  const {
    topic = 'test-topic',
    partition = 0,
    key = null,
    value = null,
    headers = {},
    timestamp = new Date().toISOString(),
    offset = '0',
    serializeValue = false,
  } = options;

  // Handle value serialization if requested
  let processedValue: T | string | Buffer | null = value;
  if (serializeValue && value !== null && typeof value === 'object' && !(value instanceof Buffer)) {
    processedValue = JSON.stringify(value) as any;
  }

  return {
    topic,
    partition,
    key,
    value: processedValue,
    headers,
    timestamp,
    offset,
  };
}

/**
 * Creates a mock Kafka message with a BaseEvent payload
 * 
 * @param event The event to use as the message value
 * @param options Additional options for creating the mock message
 * @returns A KafkaJS-compatible message object with the event as its value
 */
export function createMockEventMessage<T = unknown>(
  event: BaseEvent<T>,
  options: Omit<MockKafkaMessageOptions<BaseEvent<T>>, 'value'> = {}
): KafkaMessage<BaseEvent<T>> {
  return createMockKafkaMessage({
    ...options,
    value: event,
    serializeValue: options.serializeValue ?? false,
  });
}

/**
 * Creates a mock Kafka message with a serialized BaseEvent payload
 * 
 * @param event The event to use as the message value
 * @param options Additional options for creating the mock message
 * @returns A KafkaJS-compatible message object with the serialized event as its value
 */
export function createMockSerializedEventMessage<T = unknown>(
  event: BaseEvent<T>,
  options: Omit<MockKafkaMessageOptions<string>, 'value' | 'serializeValue'> = {}
): KafkaMessage<string> {
  return createMockKafkaMessage({
    ...options,
    value: JSON.stringify(event),
    serializeValue: false,
  });
}

/**
 * Creates a mock Kafka message with a versioned event payload
 * 
 * @param event The versioned event to use as the message value
 * @param options Additional options for creating the mock message
 * @returns A KafkaJS-compatible message object with the versioned event as its value
 */
export function createMockVersionedEventMessage<T = unknown>(
  event: IVersionedEvent<T>,
  options: Omit<MockKafkaMessageOptions<IVersionedEvent<T>>, 'value'> = {}
): KafkaMessage<IVersionedEvent<T>> {
  return createMockKafkaMessage({
    ...options,
    value: event,
    serializeValue: options.serializeValue ?? false,
  });
}

/**
 * Creates a batch of mock Kafka messages with the same structure
 * 
 * @param count Number of messages to create
 * @param baseOptions Base options for all messages
 * @param valueGenerator Optional function to generate unique values for each message
 * @returns An array of KafkaJS-compatible message objects
 */
export function createMockKafkaMessageBatch<T = unknown>(
  count: number,
  baseOptions: MockKafkaMessageOptions<T> = {},
  valueGenerator?: (index: number) => T
): KafkaMessage<T>[] {
  return Array.from({ length: count }, (_, index) => {
    const options = { ...baseOptions };
    
    // Generate a unique value if a generator is provided
    if (valueGenerator) {
      options.value = valueGenerator(index);
    }
    
    // Generate a unique offset based on the index
    options.offset = String(parseInt(options.offset || '0') + index);
    
    return createMockKafkaMessage(options);
  });
}

/**
 * Creates a batch of mock Kafka event messages
 * 
 * @param count Number of messages to create
 * @param baseEvent Base event to use for all messages
 * @param baseOptions Base options for all messages
 * @param eventModifier Optional function to modify each event
 * @returns An array of KafkaJS-compatible message objects with events as values
 */
export function createMockEventMessageBatch<T = unknown>(
  count: number,
  baseEvent: BaseEvent<T>,
  baseOptions: Omit<MockKafkaMessageOptions<BaseEvent<T>>, 'value'> = {},
  eventModifier?: (event: BaseEvent<T>, index: number) => BaseEvent<T>
): KafkaMessage<BaseEvent<T>>[] {
  return Array.from({ length: count }, (_, index) => {
    // Clone the base event to avoid modifying the original
    const eventClone = JSON.parse(JSON.stringify(baseEvent)) as BaseEvent<T>;
    
    // Generate a unique event ID for each event
    eventClone.eventId = `${eventClone.eventId}-${index}`;
    
    // Apply the modifier if provided
    const finalEvent = eventModifier ? eventModifier(eventClone, index) : eventClone;
    
    // Create the message with the modified event
    const options = { ...baseOptions };
    options.offset = String(parseInt(options.offset || '0') + index);
    
    return createMockEventMessage(finalEvent, options);
  });
}

/**
 * Creates a mock Kafka message with tracing headers
 * 
 * @param options Options for creating the mock message
 * @param traceId Trace ID for distributed tracing
 * @param spanId Span ID for distributed tracing
 * @param parentSpanId Parent span ID for distributed tracing
 * @returns A KafkaJS-compatible message object with tracing headers
 */
export function createMockKafkaMessageWithTracing<T = unknown>(
  options: MockKafkaMessageOptions<T> = {},
  traceId: string = `trace-${Date.now()}`,
  spanId: string = `span-${Date.now()}`,
  parentSpanId?: string
): KafkaMessage<T> {
  const headers: KafkaHeaders = {
    ...options.headers,
    'X-Trace-ID': traceId,
    'X-Span-ID': spanId,
  };
  
  if (parentSpanId) {
    headers['X-Parent-Span-ID'] = parentSpanId;
  }
  
  return createMockKafkaMessage({
    ...options,
    headers,
  });
}

/**
 * Creates a mock Kafka message with a corrupted value (for testing error handling)
 * 
 * @param options Options for creating the mock message
 * @returns A KafkaJS-compatible message object with a corrupted value
 */
export function createMockCorruptedMessage<T = unknown>(
  options: MockKafkaMessageOptions<T> = {}
): KafkaMessage<string> {
  return createMockKafkaMessage({
    ...options,
    value: '{"this":"is","corrupted":JSON',
    serializeValue: false,
  });
}

/**
 * Creates a mock Kafka message with an invalid event structure (for testing validation)
 * 
 * @param invalidFields Fields to omit or make invalid in the event
 * @param options Additional options for creating the mock message
 * @returns A KafkaJS-compatible message object with an invalid event structure
 */
export function createMockInvalidEventMessage(
  invalidFields: Array<keyof BaseEvent<any>>,
  options: MockKafkaMessageOptions = {}
): KafkaMessage<any> {
  // Create a base valid event
  const baseEvent: Partial<BaseEvent<any>> = {
    eventId: 'test-event-id',
    type: 'TEST_EVENT',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test-service',
    payload: { test: 'data' },
  };
  
  // Remove or invalidate specified fields
  invalidFields.forEach(field => {
    if (field === 'payload') {
      baseEvent.payload = 'invalid-payload' as any; // Should be an object
    } else if (field === 'timestamp') {
      baseEvent.timestamp = 'invalid-timestamp'; // Should be ISO format
    } else {
      delete baseEvent[field]; // Remove the field entirely
    }
  });
  
  return createMockKafkaMessage({
    ...options,
    value: baseEvent,
    serializeValue: options.serializeValue ?? false,
  });
}

/**
 * Creates a mock Kafka message with a specific error scenario
 * 
 * @param errorType The type of error scenario to create
 * @param options Additional options for creating the mock message
 * @returns A KafkaJS-compatible message object for the specified error scenario
 */
export function createMockErrorScenarioMessage(
  errorType: 'missing-key' | 'null-value' | 'invalid-headers' | 'schema-mismatch' | 'version-mismatch' | 'corrupted-json',
  options: MockKafkaMessageOptions = {}
): KafkaMessage<any> {
  switch (errorType) {
    case 'missing-key':
      return createMockKafkaMessage({
        ...options,
        key: undefined,
      });
      
    case 'null-value':
      return createMockKafkaMessage({
        ...options,
        value: null,
      });
      
    case 'invalid-headers':
      return createMockKafkaMessage({
        ...options,
        headers: { 'Content-Type': Buffer.from([0xFF, 0xFE]) }, // Invalid UTF-8
      });
      
    case 'schema-mismatch':
      return createMockKafkaMessage({
        ...options,
        value: { notAnEvent: true, someRandomField: 'value' },
        serializeValue: options.serializeValue ?? false,
      });
      
    case 'version-mismatch':
      return createMockKafkaMessage({
        ...options,
        value: {
          eventId: 'test-event-id',
          type: 'TEST_EVENT',
          timestamp: new Date().toISOString(),
          version: '999.999.999', // Unsupported version
          source: 'test-service',
          payload: { test: 'data' },
        },
        serializeValue: options.serializeValue ?? false,
      });
      
    case 'corrupted-json':
      return createMockCorruptedMessage(options);
      
    default:
      throw new Error(`Unknown error scenario: ${errorType}`);
  }
}

/**
 * Creates a mock Kafka message with retry metadata
 * 
 * @param originalMessage The original message that failed and is being retried
 * @param retryCount The number of retry attempts so far
 * @param options Additional options for creating the mock message
 * @returns A KafkaJS-compatible message object with retry metadata
 */
export function createMockRetryMessage<T = unknown>(
  originalMessage: KafkaMessage<T>,
  retryCount: number,
  options: MockKafkaMessageOptions<T> = {}
): KafkaMessage<T> {
  // Extract the original value
  let originalValue: any = originalMessage.value;
  
  // If the value is a string that looks like JSON, parse it
  if (typeof originalValue === 'string' && originalValue.startsWith('{') && originalValue.endsWith('}')) {
    try {
      originalValue = JSON.parse(originalValue);
    } catch (e) {
      // If parsing fails, keep the original string value
    }
  }
  
  // If the value is an event, add retry metadata
  if (originalValue && typeof originalValue === 'object' && 'eventId' in originalValue) {
    const event = originalValue as BaseEvent<any>;
    const metadata: EventMetadata = {
      ...(event.metadata || {}),
      isRetry: true,
      retryCount,
      originalTimestamp: event.timestamp,
    };
    
    const retryEvent: BaseEvent<any> = {
      ...event,
      timestamp: new Date().toISOString(),
      metadata,
    };
    
    return createMockKafkaMessage({
      ...options,
      topic: originalMessage.topic,
      partition: originalMessage.partition,
      key: originalMessage.key,
      value: retryEvent as any,
      headers: {
        ...originalMessage.headers,
        'X-Retry-Count': String(retryCount),
      },
      serializeValue: options.serializeValue ?? false,
    });
  }
  
  // For non-event values, just add retry headers
  return createMockKafkaMessage({
    ...options,
    topic: originalMessage.topic,
    partition: originalMessage.partition,
    key: originalMessage.key,
    value: originalMessage.value,
    headers: {
      ...originalMessage.headers,
      'X-Retry-Count': String(retryCount),
    },
  });
}

/**
 * Creates a mock dead letter queue (DLQ) message
 * 
 * @param originalMessage The original message that failed processing
 * @param error The error that occurred during processing
 * @param attempts The number of processing attempts made
 * @param options Additional options for creating the mock message
 * @returns A KafkaJS-compatible message object for the DLQ
 */
export function createMockDLQMessage<T = unknown>(
  originalMessage: KafkaMessage<T>,
  error: Error,
  attempts: number,
  options: MockKafkaMessageOptions = {}
): KafkaMessage<any> {
  const dlqPayload = {
    originalMessage: {
      topic: originalMessage.topic,
      partition: originalMessage.partition,
      offset: originalMessage.offset,
      key: originalMessage.key,
      value: originalMessage.value,
      headers: originalMessage.headers,
      timestamp: originalMessage.timestamp,
    },
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: (error as any).code,
      details: (error as any).details,
    },
    attempts,
    timestamp: new Date().toISOString(),
    consumerGroup: options.headers?.['consumer-group'] || 'unknown-group',
  };
  
  return createMockKafkaMessage({
    ...options,
    topic: `${originalMessage.topic}.dlq`,
    value: dlqPayload,
    headers: {
      'Content-Type': 'application/json',
      'X-Original-Topic': originalMessage.topic || '',
      'X-Error-Type': error.name,
      'X-Attempts': String(attempts),
    },
    serializeValue: true,
  });
}
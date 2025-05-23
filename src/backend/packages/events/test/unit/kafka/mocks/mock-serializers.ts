/**
 * @file mock-serializers.ts
 * @description Mock implementations of Kafka message serializers and deserializers for testing.
 * Provides utilities for converting between JavaScript objects and binary message formats,
 * simulating schema validation, and testing schema evolution scenarios without requiring
 * an actual schema registry.
 */

import { BaseEvent } from '../../../../src/interfaces/base-event.interface';
import { IVersionedEvent, EventVersion } from '../../../../src/interfaces/event-versioning.interface';
import { ValidationResult } from '../../../../src/interfaces/event-validation.interface';
import { KafkaHeaders, KafkaMessage } from '../../../../src/kafka/kafka.types';

// Constants for version header management
const VERSION_HEADER = 'schema-version';
const CONTENT_TYPE_HEADER = 'content-type';

/**
 * Options for mock serializers
 */
export interface MockSerializerOptions {
  /**
   * Whether to include version headers in serialized messages
   * @default true
   */
  includeVersionHeader?: boolean;

  /**
   * Whether to validate messages against schemas
   * @default true
   */
  validateSchema?: boolean;

  /**
   * Whether to simulate errors during serialization/deserialization
   * @default false
   */
  simulateErrors?: boolean;

  /**
   * Error rate for simulated errors (0-1)
   * @default 0.1
   */
  errorRate?: number;

  /**
   * Whether to measure performance of serialization operations
   * @default false
   */
  measurePerformance?: boolean;

  /**
   * Content type for serialized messages
   * @default 'application/json'
   */
  contentType?: string;

  /**
   * Custom error message for simulated errors
   */
  errorMessage?: string;

  /**
   * Whether to support backward compatibility for older versions
   * @default true
   */
  supportBackwardCompatibility?: boolean;
}

/**
 * Result of a serialization operation with performance metrics
 */
export interface SerializationResult {
  /**
   * The serialized data
   */
  data: Buffer;

  /**
   * Headers to include with the message
   */
  headers?: KafkaHeaders;

  /**
   * Performance metrics if measurement is enabled
   */
  metrics?: {
    /**
     * Time taken for serialization in milliseconds
     */
    serializationTimeMs: number;

    /**
     * Size of the serialized data in bytes
     */
    serializedSizeBytes: number;
  };
}

/**
 * Result of a deserialization operation with performance metrics
 */
export interface DeserializationResult<T = any> {
  /**
   * The deserialized data
   */
  data: T;

  /**
   * Schema version detected from the message
   */
  version?: string;

  /**
   * Content type detected from the message
   */
  contentType?: string;

  /**
   * Performance metrics if measurement is enabled
   */
  metrics?: {
    /**
     * Time taken for deserialization in milliseconds
     */
    deserializationTimeMs: number;
  };

  /**
   * Validation result if validation is enabled
   */
  validation?: ValidationResult;
}

/**
 * Error thrown during mock serialization/deserialization
 */
export class MockSerializationError extends Error {
  /**
   * The original data that caused the error
   */
  originalData: any;

  /**
   * Whether this was a serialization or deserialization error
   */
  operation: 'serialize' | 'deserialize';

  /**
   * Additional context about the error
   */
  context?: Record<string, any>;

  constructor(
    message: string,
    originalData: any,
    operation: 'serialize' | 'deserialize',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'MockSerializationError';
    this.originalData = originalData;
    this.operation = operation;
    this.context = context;
  }
}

/**
 * Creates a mock JSON serializer for testing
 * @param options Configuration options for the serializer
 * @returns A function that serializes objects to JSON buffers
 */
export function createMockJsonSerializer(options: MockSerializerOptions = {}) {
  const {
    includeVersionHeader = true,
    validateSchema = true,
    simulateErrors = false,
    errorRate = 0.1,
    measurePerformance = false,
    contentType = 'application/json',
    errorMessage = 'Simulated serialization error',
  } = options;

  return function mockJsonSerializer<T = any>(data: T, version?: string): SerializationResult {
    // Simulate errors if enabled
    if (simulateErrors && Math.random() < errorRate) {
      throw new MockSerializationError(errorMessage, data, 'serialize');
    }

    // Start performance measurement if enabled
    const startTime = measurePerformance ? performance.now() : 0;

    // Validate schema if enabled
    if (validateSchema && isBaseEvent(data)) {
      const validationResult = validateEventSchema(data);
      if (!validationResult.isValid) {
        throw new MockSerializationError(
          `Schema validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
          data,
          'serialize',
          { validationResult }
        );
      }
    }

    // Serialize to JSON
    const jsonString = JSON.stringify(data);
    const serializedData = Buffer.from(jsonString, 'utf8');

    // Create headers if needed
    const headers: KafkaHeaders = {};
    if (includeVersionHeader && version) {
      headers[VERSION_HEADER] = version;
    }
    headers[CONTENT_TYPE_HEADER] = contentType;

    // Calculate performance metrics if enabled
    const metrics = measurePerformance
      ? {
          serializationTimeMs: performance.now() - startTime,
          serializedSizeBytes: serializedData.length,
        }
      : undefined;

    return {
      data: serializedData,
      headers,
      metrics,
    };
  };
}

/**
 * Creates a mock JSON deserializer for testing
 * @param options Configuration options for the deserializer
 * @returns A function that deserializes JSON buffers to objects
 */
export function createMockJsonDeserializer(options: MockSerializerOptions = {}) {
  const {
    validateSchema = true,
    simulateErrors = false,
    errorRate = 0.1,
    measurePerformance = false,
    errorMessage = 'Simulated deserialization error',
    supportBackwardCompatibility = true,
  } = options;

  return function mockJsonDeserializer<T = any>(buffer: Buffer, headers?: KafkaHeaders): DeserializationResult<T> {
    // Simulate errors if enabled
    if (simulateErrors && Math.random() < errorRate) {
      throw new MockSerializationError(errorMessage, buffer, 'deserialize');
    }

    // Start performance measurement if enabled
    const startTime = measurePerformance ? performance.now() : 0;

    // Extract version and content type from headers
    const version = headers?.[VERSION_HEADER] as string | undefined;
    const contentType = headers?.[CONTENT_TYPE_HEADER] as string | undefined;

    // Deserialize from JSON
    try {
      const jsonString = buffer.toString('utf8');
      const data = JSON.parse(jsonString) as T;

      // Apply backward compatibility transformations if needed
      const transformedData = supportBackwardCompatibility && version
        ? applyBackwardCompatibility(data, version)
        : data;

      // Validate schema if enabled
      let validation: ValidationResult | undefined;
      if (validateSchema && isBaseEvent(transformedData)) {
        validation = validateEventSchema(transformedData);
        if (!validation.isValid) {
          throw new MockSerializationError(
            `Schema validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
            transformedData,
            'deserialize',
            { validation }
          );
        }
      }

      // Calculate performance metrics if enabled
      const metrics = measurePerformance
        ? {
            deserializationTimeMs: performance.now() - startTime,
          }
        : undefined;

      return {
        data: transformedData,
        version,
        contentType,
        metrics,
        validation,
      };
    } catch (error) {
      if (error instanceof MockSerializationError) {
        throw error;
      }
      throw new MockSerializationError(
        `Failed to deserialize JSON: ${error.message}`,
        buffer,
        'deserialize',
        { originalError: error }
      );
    }
  };
}

/**
 * Creates a mock Avro serializer for testing
 * @param options Configuration options for the serializer
 * @returns A function that serializes objects to Avro buffers
 */
export function createMockAvroSerializer(options: MockSerializerOptions = {}) {
  const {
    includeVersionHeader = true,
    validateSchema = true,
    simulateErrors = false,
    errorRate = 0.1,
    measurePerformance = false,
    contentType = 'application/avro',
    errorMessage = 'Simulated Avro serialization error',
  } = options;

  return function mockAvroSerializer<T = any>(data: T, version?: string, schema?: any): SerializationResult {
    // Simulate errors if enabled
    if (simulateErrors && Math.random() < errorRate) {
      throw new MockSerializationError(errorMessage, data, 'serialize');
    }

    // Start performance measurement if enabled
    const startTime = measurePerformance ? performance.now() : 0;

    // Validate schema if enabled
    if (validateSchema && isBaseEvent(data)) {
      const validationResult = validateEventSchema(data);
      if (!validationResult.isValid) {
        throw new MockSerializationError(
          `Schema validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
          data,
          'serialize',
          { validationResult }
        );
      }
    }

    // In a real implementation, we would use avro-js or a similar library
    // For this mock, we'll just use JSON and prepend a mock schema ID
    const jsonString = JSON.stringify(data);
    
    // Create a mock Avro buffer with a 4-byte schema ID prefix
    const schemaIdBuffer = Buffer.alloc(4);
    // Use a hash of the schema or version as the schema ID
    const schemaId = schema ? hashCode(JSON.stringify(schema)) : version ? hashCode(version) : 0;
    schemaIdBuffer.writeInt32BE(schemaId, 0);
    
    const jsonBuffer = Buffer.from(jsonString, 'utf8');
    const serializedData = Buffer.concat([schemaIdBuffer, jsonBuffer]);

    // Create headers if needed
    const headers: KafkaHeaders = {};
    if (includeVersionHeader && version) {
      headers[VERSION_HEADER] = version;
    }
    headers[CONTENT_TYPE_HEADER] = contentType;

    // Calculate performance metrics if enabled
    const metrics = measurePerformance
      ? {
          serializationTimeMs: performance.now() - startTime,
          serializedSizeBytes: serializedData.length,
        }
      : undefined;

    return {
      data: serializedData,
      headers,
      metrics,
    };
  };
}

/**
 * Creates a mock Avro deserializer for testing
 * @param options Configuration options for the deserializer
 * @returns A function that deserializes Avro buffers to objects
 */
export function createMockAvroDeserializer(options: MockSerializerOptions = {}) {
  const {
    validateSchema = true,
    simulateErrors = false,
    errorRate = 0.1,
    measurePerformance = false,
    errorMessage = 'Simulated Avro deserialization error',
    supportBackwardCompatibility = true,
  } = options;

  return function mockAvroDeserializer<T = any>(
    buffer: Buffer, 
    headers?: KafkaHeaders, 
    schemaRegistry?: Map<number, any>
  ): DeserializationResult<T> {
    // Simulate errors if enabled
    if (simulateErrors && Math.random() < errorRate) {
      throw new MockSerializationError(errorMessage, buffer, 'deserialize');
    }

    // Start performance measurement if enabled
    const startTime = measurePerformance ? performance.now() : 0;

    // Extract version and content type from headers
    const version = headers?.[VERSION_HEADER] as string | undefined;
    const contentType = headers?.[CONTENT_TYPE_HEADER] as string | undefined;

    try {
      // In a real implementation, we would use avro-js or a similar library
      // For this mock, we'll just extract the schema ID and JSON data
      if (buffer.length < 4) {
        throw new Error('Invalid Avro message: too short');
      }

      // Extract the schema ID from the first 4 bytes
      const schemaId = buffer.readInt32BE(0);
      
      // Extract the JSON data from the rest of the buffer
      const jsonBuffer = buffer.slice(4);
      const jsonString = jsonBuffer.toString('utf8');
      const data = JSON.parse(jsonString) as T;

      // Apply backward compatibility transformations if needed
      const transformedData = supportBackwardCompatibility && version
        ? applyBackwardCompatibility(data, version)
        : data;

      // Validate schema if enabled
      let validation: ValidationResult | undefined;
      if (validateSchema && isBaseEvent(transformedData)) {
        validation = validateEventSchema(transformedData);
        if (!validation.isValid) {
          throw new MockSerializationError(
            `Schema validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
            transformedData,
            'deserialize',
            { validation }
          );
        }
      }

      // Calculate performance metrics if enabled
      const metrics = measurePerformance
        ? {
            deserializationTimeMs: performance.now() - startTime,
          }
        : undefined;

      return {
        data: transformedData,
        version,
        contentType,
        metrics,
        validation,
      };
    } catch (error) {
      if (error instanceof MockSerializationError) {
        throw error;
      }
      throw new MockSerializationError(
        `Failed to deserialize Avro: ${error.message}`,
        buffer,
        'deserialize',
        { originalError: error }
      );
    }
  };
}

/**
 * Creates a mock serializer that can handle multiple formats based on content type
 * @param options Configuration options for the serializer
 * @returns A function that serializes objects to buffers based on content type
 */
export function createMockMultiFormatSerializer(options: MockSerializerOptions = {}) {
  const jsonSerializer = createMockJsonSerializer(options);
  const avroSerializer = createMockAvroSerializer(options);

  return function mockMultiFormatSerializer<T = any>(
    data: T, 
    version?: string, 
    contentType: string = 'application/json',
    schema?: any
  ): SerializationResult {
    if (contentType.includes('avro')) {
      return avroSerializer(data, version, schema);
    }
    return jsonSerializer(data, version);
  };
}

/**
 * Creates a mock deserializer that can handle multiple formats based on content type
 * @param options Configuration options for the deserializer
 * @returns A function that deserializes buffers to objects based on content type
 */
export function createMockMultiFormatDeserializer(options: MockSerializerOptions = {}) {
  const jsonDeserializer = createMockJsonDeserializer(options);
  const avroDeserializer = createMockAvroDeserializer(options);

  return function mockMultiFormatDeserializer<T = any>(
    buffer: Buffer, 
    headers?: KafkaHeaders,
    schemaRegistry?: Map<number, any>
  ): DeserializationResult<T> {
    const contentType = headers?.[CONTENT_TYPE_HEADER] as string | undefined;
    
    if (contentType?.includes('avro')) {
      return avroDeserializer(buffer, headers, schemaRegistry);
    }
    return jsonDeserializer(buffer, headers);
  };
}

/**
 * Creates a mock Kafka message with the given payload
 * @param topic The topic for the message
 * @param payload The payload for the message
 * @param options Additional options for the message
 * @returns A KafkaMessage with the given payload
 */
export function createMockKafkaMessage<T = any>(
  topic: string,
  payload: T,
  options: {
    key?: string;
    partition?: number;
    headers?: KafkaHeaders;
    timestamp?: string;
    offset?: string;
    version?: string;
    contentType?: string;
  } = {}
): KafkaMessage<T> {
  const {
    key,
    partition,
    headers = {},
    timestamp = new Date().toISOString(),
    offset,
    version,
    contentType = 'application/json',
  } = options;

  // Add version and content type headers if provided
  if (version) {
    headers[VERSION_HEADER] = version;
  }
  headers[CONTENT_TYPE_HEADER] = contentType;

  return {
    topic,
    partition,
    key,
    value: payload,
    headers,
    timestamp,
    offset,
  };
}

/**
 * Creates a mock event message with the given payload
 * @param topic The topic for the message
 * @param event The event payload
 * @param options Additional options for the message
 * @returns A KafkaMessage with the given event payload
 */
export function createMockEventMessage<T extends BaseEvent = BaseEvent>(
  topic: string,
  event: T,
  options: {
    key?: string;
    partition?: number;
    headers?: KafkaHeaders;
    timestamp?: string;
    offset?: string;
    version?: string;
    contentType?: string;
  } = {}
): KafkaMessage<T> {
  return createMockKafkaMessage(topic, event, options);
}

/**
 * Creates a mock serialized event message
 * @param topic The topic for the message
 * @param event The event payload
 * @param options Additional options for the message
 * @returns A KafkaMessage with the serialized event payload
 */
export function createMockSerializedEventMessage<T extends BaseEvent = BaseEvent>(
  topic: string,
  event: T,
  options: {
    key?: string;
    partition?: number;
    headers?: KafkaHeaders;
    timestamp?: string;
    offset?: string;
    version?: string;
    contentType?: string;
    serializerOptions?: MockSerializerOptions;
  } = {}
): KafkaMessage<Buffer> {
  const {
    key,
    partition,
    headers = {},
    timestamp = new Date().toISOString(),
    offset,
    version = event.version,
    contentType = 'application/json',
    serializerOptions = {},
  } = options;

  // Serialize the event
  const serializer = contentType.includes('avro')
    ? createMockAvroSerializer(serializerOptions)
    : createMockJsonSerializer(serializerOptions);

  const { data, headers: serializerHeaders } = serializer(event, version);

  // Merge headers
  const mergedHeaders = { ...headers, ...serializerHeaders };

  return {
    topic,
    partition,
    key,
    value: data,
    headers: mergedHeaders,
    timestamp,
    offset,
  };
}

/**
 * Utility function to check if an object is a BaseEvent
 * @param obj The object to check
 * @returns True if the object is a BaseEvent, false otherwise
 */
function isBaseEvent(obj: any): obj is BaseEvent {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.eventId === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.payload === 'object'
  );
}

/**
 * Validates an event against its schema
 * @param event The event to validate
 * @returns A ValidationResult with the validation outcome
 */
function validateEventSchema(event: BaseEvent): ValidationResult {
  const errors = [];

  // Check required fields
  if (!event.eventId) errors.push({ code: 'MISSING_FIELD', message: 'Missing required field: eventId', path: 'eventId' });
  if (!event.type) errors.push({ code: 'MISSING_FIELD', message: 'Missing required field: type', path: 'type' });
  if (!event.timestamp) errors.push({ code: 'MISSING_FIELD', message: 'Missing required field: timestamp', path: 'timestamp' });
  if (!event.version) errors.push({ code: 'MISSING_FIELD', message: 'Missing required field: version', path: 'version' });
  if (!event.source) errors.push({ code: 'MISSING_FIELD', message: 'Missing required field: source', path: 'source' });
  if (!event.payload) errors.push({ code: 'MISSING_FIELD', message: 'Missing required field: payload', path: 'payload' });

  // Validate field types
  if (event.eventId && typeof event.eventId !== 'string') {
    errors.push({ code: 'INVALID_TYPE', message: 'eventId must be a string', path: 'eventId' });
  }
  if (event.type && typeof event.type !== 'string') {
    errors.push({ code: 'INVALID_TYPE', message: 'type must be a string', path: 'type' });
  }
  if (event.timestamp && typeof event.timestamp !== 'string') {
    errors.push({ code: 'INVALID_TYPE', message: 'timestamp must be a string', path: 'timestamp' });
  }
  if (event.version && typeof event.version !== 'string') {
    errors.push({ code: 'INVALID_TYPE', message: 'version must be a string', path: 'version' });
  }
  if (event.source && typeof event.source !== 'string') {
    errors.push({ code: 'INVALID_TYPE', message: 'source must be a string', path: 'source' });
  }
  if (event.payload && typeof event.payload !== 'object') {
    errors.push({ code: 'INVALID_TYPE', message: 'payload must be an object', path: 'payload' });
  }
  if (event.userId && typeof event.userId !== 'string') {
    errors.push({ code: 'INVALID_TYPE', message: 'userId must be a string', path: 'userId' });
  }
  if (event.metadata && typeof event.metadata !== 'object') {
    errors.push({ code: 'INVALID_TYPE', message: 'metadata must be an object', path: 'metadata' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Applies backward compatibility transformations to an event
 * @param data The event data to transform
 * @param version The version of the event
 * @returns The transformed event data
 */
function applyBackwardCompatibility<T>(data: T, version: string): T {
  // This is a simplified implementation for testing
  // In a real implementation, this would apply transformations based on version
  if (!isBaseEvent(data)) {
    return data;
  }

  const versionParts = version.split('.');
  const majorVersion = parseInt(versionParts[0], 10);

  // Example transformation for version 1.x.x
  if (majorVersion === 1) {
    // No transformations needed for current version
    return data;
  }

  // Example transformation for version 2.x.x
  if (majorVersion === 2) {
    // In version 2, we might have renamed a field
    // This is just an example of how you might handle backward compatibility
    const transformedData = { ...data };
    
    // Example: if we renamed 'oldField' to 'newField' in version 2
    if ('oldField' in (transformedData.payload as any) && !('newField' in (transformedData.payload as any))) {
      (transformedData.payload as any).newField = (transformedData.payload as any).oldField;
      delete (transformedData.payload as any).oldField;
    }
    
    return transformedData;
  }

  // Default: return data unchanged
  return data;
}

/**
 * Simple hash code function for strings
 * @param str The string to hash
 * @returns A numeric hash code
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Creates a mock schema registry for testing
 * @returns A Map that simulates a schema registry
 */
export function createMockSchemaRegistry(): Map<number, any> {
  const registry = new Map<number, any>();
  
  // Add some example schemas
  const exampleSchemas = [
    { name: 'HealthMetricRecorded', version: '1.0.0', schema: { /* schema definition */ } },
    { name: 'AppointmentBooked', version: '1.0.0', schema: { /* schema definition */ } },
    { name: 'ClaimSubmitted', version: '1.0.0', schema: { /* schema definition */ } },
  ];
  
  for (const schema of exampleSchemas) {
    const schemaId = hashCode(`${schema.name}-${schema.version}`);
    registry.set(schemaId, schema);
  }
  
  return registry;
}

/**
 * Creates a mock schema validator for testing
 * @param schemaRegistry The schema registry to use for validation
 * @returns A function that validates objects against schemas
 */
export function createMockSchemaValidator(schemaRegistry: Map<number, any>) {
  return function mockSchemaValidator<T = any>(data: T, schemaId: number): ValidationResult {
    const schema = schemaRegistry.get(schemaId);
    if (!schema) {
      return {
        isValid: false,
        errors: [{ code: 'SCHEMA_NOT_FOUND', message: `Schema with ID ${schemaId} not found in registry`, path: '' }],
      };
    }
    
    // In a real implementation, this would validate against the schema
    // For this mock, we'll just check if it's a BaseEvent
    if (isBaseEvent(data)) {
      return validateEventSchema(data);
    }
    
    // For non-events, just return valid
    return {
      isValid: true,
      errors: [],
    };
  };
}

/**
 * Creates a mock performance monitor for serialization operations
 * @returns An object with methods to monitor and report performance
 */
export function createMockPerformanceMonitor() {
  const measurements: Array<{
    operation: 'serialize' | 'deserialize';
    format: string;
    sizeBytes?: number;
    timeMs: number;
    timestamp: number;
  }> = [];
  
  return {
    /**
     * Records a serialization operation
     * @param format The format used (json, avro, etc.)
     * @param sizeBytes The size of the serialized data
     * @param timeMs The time taken for serialization
     */
    recordSerialization(format: string, sizeBytes: number, timeMs: number): void {
      measurements.push({
        operation: 'serialize',
        format,
        sizeBytes,
        timeMs,
        timestamp: Date.now(),
      });
    },
    
    /**
     * Records a deserialization operation
     * @param format The format used (json, avro, etc.)
     * @param timeMs The time taken for deserialization
     */
    recordDeserialization(format: string, timeMs: number): void {
      measurements.push({
        operation: 'deserialize',
        format,
        timeMs,
        timestamp: Date.now(),
      });
    },
    
    /**
     * Gets performance statistics
     * @returns Performance statistics for serialization operations
     */
    getStatistics() {
      const serializationMeasurements = measurements.filter(m => m.operation === 'serialize');
      const deserializationMeasurements = measurements.filter(m => m.operation === 'deserialize');
      
      return {
        serialization: {
          count: serializationMeasurements.length,
          averageTimeMs: serializationMeasurements.length > 0
            ? serializationMeasurements.reduce((sum, m) => sum + m.timeMs, 0) / serializationMeasurements.length
            : 0,
          averageSizeBytes: serializationMeasurements.length > 0
            ? serializationMeasurements.reduce((sum, m) => sum + (m.sizeBytes || 0), 0) / serializationMeasurements.length
            : 0,
          byFormat: groupByFormat(serializationMeasurements),
        },
        deserialization: {
          count: deserializationMeasurements.length,
          averageTimeMs: deserializationMeasurements.length > 0
            ? deserializationMeasurements.reduce((sum, m) => sum + m.timeMs, 0) / deserializationMeasurements.length
            : 0,
          byFormat: groupByFormat(deserializationMeasurements),
        },
      };
    },
    
    /**
     * Clears all recorded measurements
     */
    clear(): void {
      measurements.length = 0;
    },
    
    /**
     * Gets all recorded measurements
     * @returns All recorded measurements
     */
    getAllMeasurements() {
      return [...measurements];
    },
  };
}

/**
 * Groups measurements by format and calculates statistics
 * @param measurements The measurements to group
 * @returns Statistics grouped by format
 */
function groupByFormat(measurements: Array<{
  operation: 'serialize' | 'deserialize';
  format: string;
  sizeBytes?: number;
  timeMs: number;
  timestamp: number;
}>) {
  const formatGroups: Record<string, {
    count: number;
    averageTimeMs: number;
    averageSizeBytes?: number;
  }> = {};
  
  for (const m of measurements) {
    if (!formatGroups[m.format]) {
      formatGroups[m.format] = {
        count: 0,
        averageTimeMs: 0,
        averageSizeBytes: m.sizeBytes !== undefined ? 0 : undefined,
      };
    }
    
    const group = formatGroups[m.format];
    group.count++;
    
    // Update running average for time
    group.averageTimeMs = (group.averageTimeMs * (group.count - 1) + m.timeMs) / group.count;
    
    // Update running average for size if available
    if (m.sizeBytes !== undefined && group.averageSizeBytes !== undefined) {
      group.averageSizeBytes = (group.averageSizeBytes * (group.count - 1) + m.sizeBytes) / group.count;
    }
  }
  
  return formatGroups;
}
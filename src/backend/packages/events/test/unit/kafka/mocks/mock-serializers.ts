/**
 * @file mock-serializers.ts
 * @description Mock implementations of Kafka message serializers and deserializers for testing.
 * 
 * This file provides utilities for converting between JavaScript objects and binary message formats,
 * simulating schema validation, and testing schema evolution scenarios without requiring an actual
 * schema registry.
 * 
 * Features:
 * - JSON serialization/deserialization with schema validation
 * - Binary protocol simulation (Avro-like)
 * - Version header management for backward compatibility testing
 * - Error injection for testing error handling
 * - Performance measurement for serialization operations
 * - Schema evolution simulation
 */

import { EventMetadataDto, EventVersionDto } from '../../../../src/dto/event-metadata.dto';
import { KafkaError, EventValidationError, MessageSerializationError } from '../../../../src/errors/kafka.errors';
import { ERROR_CODES } from '../../../../src/constants/errors.constants';

/**
 * Options for mock serializers.
 */
export interface MockSerializerOptions {
  /**
   * Whether to validate the schema of messages.
   * @default true
   */
  validateSchema?: boolean;

  /**
   * Whether to include version headers in serialized messages.
   * @default true
   */
  includeVersionHeader?: boolean;

  /**
   * Whether to simulate serialization errors.
   * @default false
   */
  simulateErrors?: boolean;

  /**
   * Error rate for simulated errors (0-1).
   * @default 0.1
   */
  errorRate?: number;

  /**
   * Whether to measure serialization performance.
   * @default false
   */
  measurePerformance?: boolean;

  /**
   * The format to use for serialization.
   * @default 'json'
   */
  format?: 'json' | 'binary' | 'avro';

  /**
   * Custom schema validation function.
   */
  schemaValidator?: (topic: string, message: any) => Promise<boolean>;

  /**
   * Schema compatibility mode for version checking.
   * @default 'backward'
   */
  compatibilityMode?: 'backward' | 'forward' | 'full' | 'none';
}

/**
 * Result of serialization performance measurement.
 */
export interface SerializationPerformance {
  /**
   * Time taken to serialize in milliseconds.
   */
  serializationTime: number;

  /**
   * Time taken to deserialize in milliseconds.
   */
  deserializationTime: number;

  /**
   * Size of the serialized message in bytes.
   */
  messageSize: number;

  /**
   * Throughput in messages per second.
   */
  throughput: number;
}

/**
 * Mock schema registry for testing.
 */
export class MockSchemaRegistry {
  private schemas: Map<string, any> = new Map();
  private versions: Map<string, EventVersionDto> = new Map();

  /**
   * Registers a schema for a topic.
   * 
   * @param topic - The topic to register the schema for
   * @param schema - The schema to register
   * @param version - Optional version information
   */
  registerSchema(topic: string, schema: any, version?: EventVersionDto): void {
    this.schemas.set(topic, schema);
    if (version) {
      this.versions.set(topic, version);
    } else {
      this.versions.set(topic, new EventVersionDto());
    }
  }

  /**
   * Gets the schema for a topic.
   * 
   * @param topic - The topic to get the schema for
   * @returns The schema or undefined if not found
   */
  getSchema(topic: string): any {
    return this.schemas.get(topic);
  }

  /**
   * Gets the version for a topic.
   * 
   * @param topic - The topic to get the version for
   * @returns The version or a default version if not found
   */
  getVersion(topic: string): EventVersionDto {
    return this.versions.get(topic) || new EventVersionDto();
  }

  /**
   * Validates a message against the schema for a topic.
   * 
   * @param topic - The topic to validate against
   * @param message - The message to validate
   * @returns Promise that resolves to true if valid, or rejects with an error if invalid
   */
  async validate(topic: string, message: any): Promise<boolean> {
    const schema = this.schemas.get(topic);
    if (!schema) {
      throw new EventValidationError(
        `Schema not found for topic ${topic}`,
        ERROR_CODES.SCHEMA_NOT_FOUND,
        { topic }
      );
    }

    // Simple schema validation simulation
    // In a real implementation, this would use a schema validation library
    const valid = this.validateAgainstSchema(message, schema);
    if (!valid) {
      throw new EventValidationError(
        `Message failed schema validation for topic ${topic}`,
        ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        { topic, schema: JSON.stringify(schema) }
      );
    }

    return true;
  }

  /**
   * Checks if a message is compatible with a schema version.
   * 
   * @param topic - The topic to check compatibility for
   * @param message - The message to check
   * @param messageVersion - The version of the message
   * @param mode - The compatibility mode to use
   * @returns True if compatible, false otherwise
   */
  isCompatible(
    topic: string,
    message: any,
    messageVersion: EventVersionDto,
    mode: 'backward' | 'forward' | 'full' | 'none' = 'backward'
  ): boolean {
    if (mode === 'none') {
      return true;
    }

    const schemaVersion = this.getVersion(topic);
    
    // Parse versions as numbers for comparison
    const msgMajor = parseInt(messageVersion.major, 10);
    const msgMinor = parseInt(messageVersion.minor, 10);
    const msgPatch = parseInt(messageVersion.patch, 10);
    
    const schemaMajor = parseInt(schemaVersion.major, 10);
    const schemaMinor = parseInt(schemaVersion.minor, 10);
    const schemaPatch = parseInt(schemaVersion.patch, 10);

    // Major version must match exactly for all compatibility modes
    if (msgMajor !== schemaMajor) {
      return false;
    }

    switch (mode) {
      case 'backward':
        // Newer schema can read older messages
        // Message version must be less than or equal to schema version
        return (
          msgMinor < schemaMinor ||
          (msgMinor === schemaMinor && msgPatch <= schemaPatch)
        );

      case 'forward':
        // Older schema can read newer messages
        // Message version must be greater than or equal to schema version
        return (
          msgMinor > schemaMinor ||
          (msgMinor === schemaMinor && msgPatch >= schemaPatch)
        );

      case 'full':
        // Full compatibility (backward and forward)
        // Message version must be exactly equal to schema version
        return msgMinor === schemaMinor && msgPatch === schemaPatch;

      default:
        return false;
    }
  }

  /**
   * Simple schema validation simulation.
   * 
   * @param message - The message to validate
   * @param schema - The schema to validate against
   * @returns True if valid, false otherwise
   * @private
   */
  private validateAgainstSchema(message: any, schema: any): boolean {
    // This is a simplified validation for testing purposes
    // In a real implementation, this would use a schema validation library
    
    // Check if all required fields in the schema exist in the message
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (message[field] === undefined) {
          return false;
        }
      }
    }

    // Check if fields match the expected types
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries<any>(schema.properties)) {
        if (message[field] !== undefined) {
          // Check type
          if (fieldSchema.type && typeof message[field] !== fieldSchema.type) {
            // Special case for 'number' type in JSON Schema vs JavaScript
            if (!(fieldSchema.type === 'number' && typeof message[field] === 'number')) {
              return false;
            }
          }

          // Check enum values
          if (fieldSchema.enum && !fieldSchema.enum.includes(message[field])) {
            return false;
          }
        }
      }
    }

    return true;
  }
}

/**
 * Creates a mock JSON serializer for testing.
 * 
 * @param options - Options for the serializer
 * @param schemaRegistry - Optional schema registry for validation
 * @returns Object with serialize and deserialize functions
 */
export function createMockJsonSerializer(
  options: MockSerializerOptions = {},
  schemaRegistry?: MockSchemaRegistry
) {
  const {
    validateSchema = true,
    includeVersionHeader = true,
    simulateErrors = false,
    errorRate = 0.1,
    measurePerformance = false,
    compatibilityMode = 'backward',
  } = options;

  const performanceMetrics: SerializationPerformance = {
    serializationTime: 0,
    deserializationTime: 0,
    messageSize: 0,
    throughput: 0,
  };

  /**
   * Serializes a message to a Buffer.
   * 
   * @param topic - The topic the message is for
   * @param message - The message to serialize
   * @param headers - Optional headers to include
   * @returns Promise resolving to a Buffer containing the serialized message
   */
  async function serialize(
    topic: string,
    message: any,
    headers: Record<string, string> = {}
  ): Promise<{ buffer: Buffer; headers: Record<string, string> }> {
    // Simulate errors if enabled
    if (simulateErrors && Math.random() < errorRate) {
      throw new MessageSerializationError(
        'Simulated serialization error',
        ERROR_CODES.MESSAGE_SERIALIZATION_FAILED,
        { topic }
      );
    }

    // Validate schema if enabled and registry is provided
    if (validateSchema && schemaRegistry) {
      await schemaRegistry.validate(topic, message);
    }

    // Add version header if enabled
    const enrichedHeaders = { ...headers };
    if (includeVersionHeader && schemaRegistry) {
      const version = schemaRegistry.getVersion(topic);
      enrichedHeaders['schema-version'] = version.toString();
    }

    // Measure performance if enabled
    let startTime: number | undefined;
    if (measurePerformance) {
      startTime = performance.now();
    }

    // Serialize message to JSON
    const jsonString = JSON.stringify(message);
    const buffer = Buffer.from(jsonString, 'utf8');

    // Update performance metrics if enabled
    if (measurePerformance && startTime !== undefined) {
      const endTime = performance.now();
      performanceMetrics.serializationTime = endTime - startTime;
      performanceMetrics.messageSize = buffer.length;
      performanceMetrics.throughput = 1000 / performanceMetrics.serializationTime;
    }

    return { buffer, headers: enrichedHeaders };
  }

  /**
   * Deserializes a message from a Buffer.
   * 
   * @param topic - The topic the message is from
   * @param buffer - The buffer containing the serialized message
   * @param headers - Optional headers from the message
   * @returns Promise resolving to the deserialized message
   */
  async function deserialize<T = any>(
    topic: string,
    buffer: Buffer,
    headers: Record<string, string> = {}
  ): Promise<T> {
    // Simulate errors if enabled
    if (simulateErrors && Math.random() < errorRate) {
      throw new MessageSerializationError(
        'Simulated deserialization error',
        ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
        { topic }
      );
    }

    // Measure performance if enabled
    let startTime: number | undefined;
    if (measurePerformance) {
      startTime = performance.now();
    }

    // Deserialize message from JSON
    const jsonString = buffer.toString('utf8');
    let message: T;
    try {
      message = JSON.parse(jsonString);
    } catch (error) {
      throw new MessageSerializationError(
        'Failed to parse JSON message',
        ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
        { topic },
        error as Error
      );
    }

    // Check version compatibility if enabled and registry is provided
    if (includeVersionHeader && schemaRegistry && headers['schema-version']) {
      const messageVersion = EventVersionDto.fromString(headers['schema-version']);
      const isCompatible = schemaRegistry.isCompatible(
        topic,
        message,
        messageVersion,
        compatibilityMode
      );

      if (!isCompatible) {
        throw new EventValidationError(
          `Message version ${messageVersion.toString()} is not compatible with schema version ${schemaRegistry.getVersion(topic).toString()} for topic ${topic}`,
          ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          { topic, messageVersion: messageVersion.toString(), schemaVersion: schemaRegistry.getVersion(topic).toString() }
        );
      }
    }

    // Update performance metrics if enabled
    if (measurePerformance && startTime !== undefined) {
      const endTime = performance.now();
      performanceMetrics.deserializationTime = endTime - startTime;
    }

    return message;
  }

  /**
   * Gets the current performance metrics.
   * 
   * @returns The current performance metrics
   */
  function getPerformanceMetrics(): SerializationPerformance {
    return { ...performanceMetrics };
  }

  /**
   * Resets the performance metrics.
   */
  function resetPerformanceMetrics(): void {
    performanceMetrics.serializationTime = 0;
    performanceMetrics.deserializationTime = 0;
    performanceMetrics.messageSize = 0;
    performanceMetrics.throughput = 0;
  }

  return {
    serialize,
    deserialize,
    getPerformanceMetrics,
    resetPerformanceMetrics,
  };
}

/**
 * Creates a mock binary serializer for testing.
 * This simulates a binary protocol like Avro without requiring the actual library.
 * 
 * @param options - Options for the serializer
 * @param schemaRegistry - Optional schema registry for validation
 * @returns Object with serialize and deserialize functions
 */
export function createMockBinarySerializer(
  options: MockSerializerOptions = {},
  schemaRegistry?: MockSchemaRegistry
) {
  const {
    validateSchema = true,
    includeVersionHeader = true,
    simulateErrors = false,
    errorRate = 0.1,
    measurePerformance = false,
    compatibilityMode = 'backward',
  } = options;

  const performanceMetrics: SerializationPerformance = {
    serializationTime: 0,
    deserializationTime: 0,
    messageSize: 0,
    throughput: 0,
  };

  /**
   * Serializes a message to a Buffer using a binary format.
   * 
   * @param topic - The topic the message is for
   * @param message - The message to serialize
   * @param headers - Optional headers to include
   * @returns Promise resolving to a Buffer containing the serialized message
   */
  async function serialize(
    topic: string,
    message: any,
    headers: Record<string, string> = {}
  ): Promise<{ buffer: Buffer; headers: Record<string, string> }> {
    // Simulate errors if enabled
    if (simulateErrors && Math.random() < errorRate) {
      throw new MessageSerializationError(
        'Simulated binary serialization error',
        ERROR_CODES.MESSAGE_SERIALIZATION_FAILED,
        { topic }
      );
    }

    // Validate schema if enabled and registry is provided
    if (validateSchema && schemaRegistry) {
      await schemaRegistry.validate(topic, message);
    }

    // Add version header if enabled
    const enrichedHeaders = { ...headers };
    if (includeVersionHeader && schemaRegistry) {
      const version = schemaRegistry.getVersion(topic);
      enrichedHeaders['schema-version'] = version.toString();
    }

    // Measure performance if enabled
    let startTime: number | undefined;
    if (measurePerformance) {
      startTime = performance.now();
    }

    // Simulate binary serialization
    // In a real implementation, this would use a binary serialization library like Avro
    // For testing, we'll just use a simple binary format
    
    // Convert to JSON first
    const jsonString = JSON.stringify(message);
    
    // Create a buffer with a 4-byte header for the message length
    const messageBuffer = Buffer.from(jsonString, 'utf8');
    const headerBuffer = Buffer.alloc(4);
    headerBuffer.writeUInt32BE(messageBuffer.length, 0);
    
    // Combine header and message
    const buffer = Buffer.concat([headerBuffer, messageBuffer]);

    // Update performance metrics if enabled
    if (measurePerformance && startTime !== undefined) {
      const endTime = performance.now();
      performanceMetrics.serializationTime = endTime - startTime;
      performanceMetrics.messageSize = buffer.length;
      performanceMetrics.throughput = 1000 / performanceMetrics.serializationTime;
    }

    return { buffer, headers: enrichedHeaders };
  }

  /**
   * Deserializes a message from a Buffer using a binary format.
   * 
   * @param topic - The topic the message is from
   * @param buffer - The buffer containing the serialized message
   * @param headers - Optional headers from the message
   * @returns Promise resolving to the deserialized message
   */
  async function deserialize<T = any>(
    topic: string,
    buffer: Buffer,
    headers: Record<string, string> = {}
  ): Promise<T> {
    // Simulate errors if enabled
    if (simulateErrors && Math.random() < errorRate) {
      throw new MessageSerializationError(
        'Simulated binary deserialization error',
        ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
        { topic }
      );
    }

    // Measure performance if enabled
    let startTime: number | undefined;
    if (measurePerformance) {
      startTime = performance.now();
    }

    // Simulate binary deserialization
    // In a real implementation, this would use a binary deserialization library like Avro
    // For testing, we'll just use our simple binary format
    
    try {
      // Read the message length from the header
      const messageLength = buffer.readUInt32BE(0);
      
      // Extract the message buffer
      const messageBuffer = buffer.subarray(4, 4 + messageLength);
      
      // Parse the JSON message
      const jsonString = messageBuffer.toString('utf8');
      const message = JSON.parse(jsonString) as T;

      // Check version compatibility if enabled and registry is provided
      if (includeVersionHeader && schemaRegistry && headers['schema-version']) {
        const messageVersion = EventVersionDto.fromString(headers['schema-version']);
        const isCompatible = schemaRegistry.isCompatible(
          topic,
          message,
          messageVersion,
          compatibilityMode
        );

        if (!isCompatible) {
          throw new EventValidationError(
            `Message version ${messageVersion.toString()} is not compatible with schema version ${schemaRegistry.getVersion(topic).toString()} for topic ${topic}`,
            ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            { topic, messageVersion: messageVersion.toString(), schemaVersion: schemaRegistry.getVersion(topic).toString() }
          );
        }
      }

      // Update performance metrics if enabled
      if (measurePerformance && startTime !== undefined) {
        const endTime = performance.now();
        performanceMetrics.deserializationTime = endTime - startTime;
      }

      return message;
    } catch (error) {
      throw new MessageSerializationError(
        'Failed to deserialize binary message',
        ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
        { topic },
        error as Error
      );
    }
  }

  /**
   * Gets the current performance metrics.
   * 
   * @returns The current performance metrics
   */
  function getPerformanceMetrics(): SerializationPerformance {
    return { ...performanceMetrics };
  }

  /**
   * Resets the performance metrics.
   */
  function resetPerformanceMetrics(): void {
    performanceMetrics.serializationTime = 0;
    performanceMetrics.deserializationTime = 0;
    performanceMetrics.messageSize = 0;
    performanceMetrics.throughput = 0;
  }

  return {
    serialize,
    deserialize,
    getPerformanceMetrics,
    resetPerformanceMetrics,
  };
}

/**
 * Creates a mock Avro serializer for testing.
 * This simulates Avro serialization without requiring the actual library.
 * 
 * @param options - Options for the serializer
 * @param schemaRegistry - Optional schema registry for validation
 * @returns Object with serialize and deserialize functions
 */
export function createMockAvroSerializer(
  options: MockSerializerOptions = {},
  schemaRegistry?: MockSchemaRegistry
) {
  // Avro serialization is similar to binary but with specific format
  // For testing purposes, we'll reuse the binary serializer with some modifications
  const binarySerializer = createMockBinarySerializer(options, schemaRegistry);

  /**
   * Serializes a message to a Buffer using Avro format.
   * 
   * @param topic - The topic the message is for
   * @param message - The message to serialize
   * @param headers - Optional headers to include
   * @returns Promise resolving to a Buffer containing the serialized message
   */
  async function serialize(
    topic: string,
    message: any,
    headers: Record<string, string> = {}
  ): Promise<{ buffer: Buffer; headers: Record<string, string> }> {
    // Add Avro-specific headers
    const avroHeaders = {
      ...headers,
      'content-type': 'application/avro',
    };

    // Use binary serializer with Avro headers
    return binarySerializer.serialize(topic, message, avroHeaders);
  }

  /**
   * Deserializes a message from a Buffer using Avro format.
   * 
   * @param topic - The topic the message is from
   * @param buffer - The buffer containing the serialized message
   * @param headers - Optional headers from the message
   * @returns Promise resolving to the deserialized message
   */
  async function deserialize<T = any>(
    topic: string,
    buffer: Buffer,
    headers: Record<string, string> = {}
  ): Promise<T> {
    // Check for Avro content type
    if (headers['content-type'] !== 'application/avro') {
      throw new MessageSerializationError(
        'Invalid content type for Avro deserialization',
        ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
        { topic, contentType: headers['content-type'] }
      );
    }

    // Use binary deserializer
    return binarySerializer.deserialize<T>(topic, buffer, headers);
  }

  return {
    serialize,
    deserialize,
    getPerformanceMetrics: binarySerializer.getPerformanceMetrics,
    resetPerformanceMetrics: binarySerializer.resetPerformanceMetrics,
  };
}

/**
 * Creates a serializer factory that returns the appropriate serializer based on format.
 * 
 * @param options - Default options for serializers
 * @param schemaRegistry - Optional schema registry for validation
 * @returns Factory function that creates serializers
 */
export function createSerializerFactory(
  options: MockSerializerOptions = {},
  schemaRegistry?: MockSchemaRegistry
) {
  /**
   * Creates a serializer for the specified format.
   * 
   * @param format - The format to create a serializer for
   * @param overrideOptions - Options that override the default options
   * @returns The appropriate serializer for the format
   */
  function createSerializer(
    format: 'json' | 'binary' | 'avro' = 'json',
    overrideOptions: Partial<MockSerializerOptions> = {}
  ) {
    const mergedOptions = {
      ...options,
      ...overrideOptions,
      format,
    };

    switch (format) {
      case 'json':
        return createMockJsonSerializer(mergedOptions, schemaRegistry);
      case 'binary':
        return createMockBinarySerializer(mergedOptions, schemaRegistry);
      case 'avro':
        return createMockAvroSerializer(mergedOptions, schemaRegistry);
      default:
        return createMockJsonSerializer(mergedOptions, schemaRegistry);
    }
  }

  return createSerializer;
}

/**
 * Creates a mock serializer with error injection for testing error handling.
 * 
 * @param baseSerializer - The base serializer to wrap
 * @param errorConfig - Configuration for error injection
 * @returns Serializer with error injection
 */
export function createErrorInjectingSerializer(
  baseSerializer: ReturnType<typeof createMockJsonSerializer>,
  errorConfig: {
    serializeErrorRate?: number;
    deserializeErrorRate?: number;
    errorMessage?: string;
    errorCode?: string;
  } = {}
) {
  const {
    serializeErrorRate = 0.5,
    deserializeErrorRate = 0.5,
    errorMessage = 'Injected serialization error',
    errorCode = ERROR_CODES.MESSAGE_SERIALIZATION_FAILED,
  } = errorConfig;

  /**
   * Serializes a message with error injection.
   * 
   * @param topic - The topic the message is for
   * @param message - The message to serialize
   * @param headers - Optional headers to include
   * @returns Promise resolving to a Buffer containing the serialized message
   */
  async function serialize(
    topic: string,
    message: any,
    headers: Record<string, string> = {}
  ): Promise<{ buffer: Buffer; headers: Record<string, string> }> {
    if (Math.random() < serializeErrorRate) {
      throw new MessageSerializationError(
        errorMessage,
        errorCode,
        { topic, injected: true }
      );
    }

    return baseSerializer.serialize(topic, message, headers);
  }

  /**
   * Deserializes a message with error injection.
   * 
   * @param topic - The topic the message is from
   * @param buffer - The buffer containing the serialized message
   * @param headers - Optional headers from the message
   * @returns Promise resolving to the deserialized message
   */
  async function deserialize<T = any>(
    topic: string,
    buffer: Buffer,
    headers: Record<string, string> = {}
  ): Promise<T> {
    if (Math.random() < deserializeErrorRate) {
      throw new MessageSerializationError(
        errorMessage,
        errorCode,
        { topic, injected: true }
      );
    }

    return baseSerializer.deserialize<T>(topic, buffer, headers);
  }

  return {
    serialize,
    deserialize,
    getPerformanceMetrics: baseSerializer.getPerformanceMetrics,
    resetPerformanceMetrics: baseSerializer.resetPerformanceMetrics,
  };
}

/**
 * Creates a mock serializer that simulates version incompatibility for testing.
 * 
 * @param baseSerializer - The base serializer to wrap
 * @param incompatibleVersions - Map of topic to incompatible version ranges
 * @returns Serializer with version incompatibility simulation
 */
export function createVersionIncompatibleSerializer(
  baseSerializer: ReturnType<typeof createMockJsonSerializer>,
  incompatibleVersions: Map<string, { minVersion: string; maxVersion: string }>
) {
  /**
   * Serializes a message with version header manipulation.
   * 
   * @param topic - The topic the message is for
   * @param message - The message to serialize
   * @param headers - Optional headers to include
   * @returns Promise resolving to a Buffer containing the serialized message
   */
  async function serialize(
    topic: string,
    message: any,
    headers: Record<string, string> = {}
  ): Promise<{ buffer: Buffer; headers: Record<string, string> }> {
    const result = await baseSerializer.serialize(topic, message, headers);
    
    // If this topic has incompatible version configuration, modify the version header
    if (incompatibleVersions.has(topic)) {
      const incompatible = incompatibleVersions.get(topic)!;
      result.headers['schema-version'] = incompatible.maxVersion;
    }
    
    return result;
  }

  /**
   * Deserializes a message with version compatibility checking.
   * 
   * @param topic - The topic the message is from
   * @param buffer - The buffer containing the serialized message
   * @param headers - Optional headers from the message
   * @returns Promise resolving to the deserialized message
   */
  async function deserialize<T = any>(
    topic: string,
    buffer: Buffer,
    headers: Record<string, string> = {}
  ): Promise<T> {
    // If this topic has incompatible version configuration, check the version header
    if (incompatibleVersions.has(topic) && headers['schema-version']) {
      const incompatible = incompatibleVersions.get(topic)!;
      const version = headers['schema-version'];
      
      // Check if version is in the incompatible range
      if (version >= incompatible.minVersion && version <= incompatible.maxVersion) {
        throw new EventValidationError(
          `Message version ${version} is not compatible with consumer for topic ${topic}`,
          ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          { topic, messageVersion: version, incompatibleRange: `${incompatible.minVersion}-${incompatible.maxVersion}` }
        );
      }
    }
    
    return baseSerializer.deserialize<T>(topic, buffer, headers);
  }

  return {
    serialize,
    deserialize,
    getPerformanceMetrics: baseSerializer.getPerformanceMetrics,
    resetPerformanceMetrics: baseSerializer.resetPerformanceMetrics,
  };
}

/**
 * Creates a mock serializer that measures and logs performance metrics.
 * 
 * @param baseSerializer - The base serializer to wrap
 * @param logFunction - Function to log performance metrics
 * @returns Serializer with performance measurement
 */
export function createPerformanceMeasuringSerializer(
  baseSerializer: ReturnType<typeof createMockJsonSerializer>,
  logFunction: (metrics: SerializationPerformance, topic: string) => void
) {
  /**
   * Serializes a message and measures performance.
   * 
   * @param topic - The topic the message is for
   * @param message - The message to serialize
   * @param headers - Optional headers to include
   * @returns Promise resolving to a Buffer containing the serialized message
   */
  async function serialize(
    topic: string,
    message: any,
    headers: Record<string, string> = {}
  ): Promise<{ buffer: Buffer; headers: Record<string, string> }> {
    const startTime = performance.now();
    const result = await baseSerializer.serialize(topic, message, headers);
    const endTime = performance.now();
    
    const metrics = baseSerializer.getPerformanceMetrics();
    metrics.serializationTime = endTime - startTime;
    metrics.messageSize = result.buffer.length;
    metrics.throughput = 1000 / metrics.serializationTime;
    
    logFunction(metrics, topic);
    
    return result;
  }

  /**
   * Deserializes a message and measures performance.
   * 
   * @param topic - The topic the message is from
   * @param buffer - The buffer containing the serialized message
   * @param headers - Optional headers from the message
   * @returns Promise resolving to the deserialized message
   */
  async function deserialize<T = any>(
    topic: string,
    buffer: Buffer,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const startTime = performance.now();
    const result = await baseSerializer.deserialize<T>(topic, buffer, headers);
    const endTime = performance.now();
    
    const metrics = baseSerializer.getPerformanceMetrics();
    metrics.deserializationTime = endTime - startTime;
    
    logFunction(metrics, topic);
    
    return result;
  }

  return {
    serialize,
    deserialize,
    getPerformanceMetrics: baseSerializer.getPerformanceMetrics,
    resetPerformanceMetrics: baseSerializer.resetPerformanceMetrics,
  };
}
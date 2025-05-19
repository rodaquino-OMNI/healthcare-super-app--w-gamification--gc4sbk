/**
 * Mock implementations of Kafka message serializers and deserializers for testing.
 * 
 * This file provides utilities for converting between JavaScript objects and binary message formats,
 * simulating schema validation, and testing schema evolution scenarios without requiring an actual
 * schema registry.
 */

import { randomUUID } from 'crypto';

/**
 * Configuration options for mock serializers
 */
export interface MockSerializerOptions {
  /** Whether to simulate schema validation */
  validateSchema?: boolean;
  /** Whether to include version headers */
  includeVersionHeader?: boolean;
  /** Schema version to use (defaults to 1) */
  schemaVersion?: number;
  /** Whether to simulate serialization errors */
  simulateErrors?: boolean;
  /** Error rate (0-1) when simulateErrors is true */
  errorRate?: number;
  /** Whether to measure serialization performance */
  measurePerformance?: boolean;
  /** Custom validation function for schema validation */
  validator?: (data: unknown) => boolean | string;
}

/**
 * Default serializer options
 */
const DEFAULT_OPTIONS: MockSerializerOptions = {
  validateSchema: true,
  includeVersionHeader: true,
  schemaVersion: 1,
  simulateErrors: false,
  errorRate: 0.1,
  measurePerformance: false,
};

/**
 * Result of a serialization or deserialization operation
 */
export interface SerializationResult<T = unknown> {
  /** Whether the operation was successful */
  success: boolean;
  /** The resulting data (if successful) */
  data?: T;
  /** Error message (if unsuccessful) */
  error?: string;
  /** Performance metrics in milliseconds (if measurePerformance is true) */
  performance?: {
    /** Time taken to serialize/deserialize in milliseconds */
    duration: number;
    /** Size of the serialized data in bytes */
    size?: number;
  };
}

/**
 * Mock serializer for JSON format
 * 
 * @param data - The data to serialize
 * @param options - Serializer options
 * @returns A serialization result with the serialized buffer
 */
export function mockJsonSerializer<T = unknown>(
  data: T,
  options: MockSerializerOptions = {}
): SerializationResult<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = opts.measurePerformance ? performance.now() : 0;
  
  try {
    // Simulate errors if configured
    if (opts.simulateErrors && Math.random() < opts.errorRate) {
      throw new Error('Simulated serialization error');
    }
    
    // Validate schema if configured
    if (opts.validateSchema) {
      if (opts.validator) {
        const validationResult = opts.validator(data);
        if (validationResult !== true) {
          throw new Error(
            typeof validationResult === 'string'
              ? validationResult
              : 'Schema validation failed'
          );
        }
      } else if (!data) {
        throw new Error('Data is required');
      }
    }
    
    // Create a wrapper with version information if configured
    const payload = opts.includeVersionHeader
      ? { __version: opts.schemaVersion, __data: data }
      : data;
    
    // Serialize to JSON string then to Buffer
    const jsonString = JSON.stringify(payload);
    const buffer = Buffer.from(jsonString, 'utf8');
    
    // Calculate performance metrics if configured
    const result: SerializationResult<Buffer> = {
      success: true,
      data: buffer,
    };
    
    if (opts.measurePerformance) {
      result.performance = {
        duration: performance.now() - startTime,
        size: buffer.length,
      };
    }
    
    return result;
  } catch (error) {
    const result: SerializationResult<Buffer> = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    
    if (opts.measurePerformance) {
      result.performance = {
        duration: performance.now() - startTime,
      };
    }
    
    return result;
  }
}

/**
 * Mock deserializer for JSON format
 * 
 * @param buffer - The buffer to deserialize
 * @param options - Deserializer options
 * @returns A serialization result with the deserialized data
 */
export function mockJsonDeserializer<T = unknown>(
  buffer: Buffer,
  options: MockSerializerOptions = {}
): SerializationResult<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = opts.measurePerformance ? performance.now() : 0;
  
  try {
    // Simulate errors if configured
    if (opts.simulateErrors && Math.random() < opts.errorRate) {
      throw new Error('Simulated deserialization error');
    }
    
    // Deserialize from Buffer to JSON
    const jsonString = buffer.toString('utf8');
    const parsed = JSON.parse(jsonString);
    
    // Extract data from version wrapper if present
    let data: T;
    let version: number | undefined;
    
    if (parsed && typeof parsed === 'object' && '__data' in parsed && '__version' in parsed) {
      data = parsed.__data as T;
      version = parsed.__version as number;
      
      // Validate version if configured
      if (opts.validateSchema && opts.schemaVersion && version !== opts.schemaVersion) {
        throw new Error(
          `Schema version mismatch. Expected ${opts.schemaVersion}, got ${version}`
        );
      }
    } else {
      data = parsed as T;
    }
    
    // Validate schema if configured
    if (opts.validateSchema && opts.validator) {
      const validationResult = opts.validator(data);
      if (validationResult !== true) {
        throw new Error(
          typeof validationResult === 'string'
            ? validationResult
            : 'Schema validation failed'
        );
      }
    }
    
    // Calculate performance metrics if configured
    const result: SerializationResult<T> = {
      success: true,
      data,
    };
    
    if (opts.measurePerformance) {
      result.performance = {
        duration: performance.now() - startTime,
        size: buffer.length,
      };
    }
    
    return result;
  } catch (error) {
    const result: SerializationResult<T> = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    
    if (opts.measurePerformance) {
      result.performance = {
        duration: performance.now() - startTime,
      };
    }
    
    return result;
  }
}

/**
 * Mock schema registry for testing schema evolution
 */
export class MockSchemaRegistry {
  private schemas: Map<string, any> = new Map();
  private versions: Map<string, number[]> = new Map();
  
  /**
   * Register a new schema
   * 
   * @param subject - The schema subject name
   * @param schema - The schema definition
   * @param version - The schema version
   * @returns The schema ID
   */
  registerSchema(subject: string, schema: any, version: number = 1): string {
    const schemaId = randomUUID();
    this.schemas.set(schemaId, { subject, schema, version });
    
    // Track versions for this subject
    const existingVersions = this.versions.get(subject) || [];
    this.versions.set(subject, [...existingVersions, version].sort());
    
    return schemaId;
  }
  
  /**
   * Get a schema by ID
   * 
   * @param schemaId - The schema ID
   * @returns The schema or undefined if not found
   */
  getSchema(schemaId: string): any | undefined {
    return this.schemas.get(schemaId);
  }
  
  /**
   * Get the latest schema version for a subject
   * 
   * @param subject - The schema subject name
   * @returns The latest schema version or undefined if not found
   */
  getLatestVersion(subject: string): number | undefined {
    const versions = this.versions.get(subject);
    if (!versions || versions.length === 0) return undefined;
    return versions[versions.length - 1];
  }
  
  /**
   * Check if data is compatible with a schema
   * 
   * @param subject - The schema subject name
   * @param data - The data to validate
   * @param version - The schema version (defaults to latest)
   * @returns True if compatible, false otherwise
   */
  isCompatible(subject: string, data: unknown, version?: number): boolean {
    // This is a simplified mock implementation
    // In a real implementation, this would use a schema validation library
    return true;
  }
}

/**
 * Mock Avro serializer for testing binary protocols
 * 
 * @param data - The data to serialize
 * @param schemaId - The schema ID to use
 * @param registry - The mock schema registry
 * @param options - Serializer options
 * @returns A serialization result with the serialized buffer
 */
export function mockAvroSerializer<T = unknown>(
  data: T,
  schemaId: string,
  registry: MockSchemaRegistry,
  options: MockSerializerOptions = {}
): SerializationResult<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = opts.measurePerformance ? performance.now() : 0;
  
  try {
    // Simulate errors if configured
    if (opts.simulateErrors && Math.random() < opts.errorRate) {
      throw new Error('Simulated Avro serialization error');
    }
    
    // Get schema from registry
    const schemaInfo = registry.getSchema(schemaId);
    if (!schemaInfo) {
      throw new Error(`Schema not found for ID: ${schemaId}`);
    }
    
    // In a real implementation, this would use avro-js or a similar library
    // For this mock, we'll just use JSON serialization with a header
    
    // Create a 5-byte header (1 byte magic byte + 4 bytes schema ID)
    const header = Buffer.alloc(5);
    header.writeUInt8(0, 0); // Magic byte (0 in this mock)
    header.writeUInt32BE(parseInt(schemaId.slice(0, 8), 16), 1); // First 8 chars of UUID as number
    
    // Serialize the data as JSON
    const jsonResult = mockJsonSerializer(data, {
      ...opts,
      includeVersionHeader: true,
      schemaVersion: schemaInfo.version,
    });
    
    if (!jsonResult.success || !jsonResult.data) {
      throw new Error(jsonResult.error || 'JSON serialization failed');
    }
    
    // Combine header and data
    const buffer = Buffer.concat([header, jsonResult.data]);
    
    // Calculate performance metrics if configured
    const result: SerializationResult<Buffer> = {
      success: true,
      data: buffer,
    };
    
    if (opts.measurePerformance) {
      result.performance = {
        duration: performance.now() - startTime,
        size: buffer.length,
      };
    }
    
    return result;
  } catch (error) {
    const result: SerializationResult<Buffer> = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    
    if (opts.measurePerformance) {
      result.performance = {
        duration: performance.now() - startTime,
      };
    }
    
    return result;
  }
}

/**
 * Mock Avro deserializer for testing binary protocols
 * 
 * @param buffer - The buffer to deserialize
 * @param registry - The mock schema registry
 * @param options - Deserializer options
 * @returns A serialization result with the deserialized data
 */
export function mockAvroDeserializer<T = unknown>(
  buffer: Buffer,
  registry: MockSchemaRegistry,
  options: MockSerializerOptions = {}
): SerializationResult<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = opts.measurePerformance ? performance.now() : 0;
  
  try {
    // Simulate errors if configured
    if (opts.simulateErrors && Math.random() < opts.errorRate) {
      throw new Error('Simulated Avro deserialization error');
    }
    
    // Buffer must be at least 5 bytes (1 magic byte + 4 byte schema ID)
    if (buffer.length < 5) {
      throw new Error('Invalid Avro message: too short');
    }
    
    // Extract header
    const magicByte = buffer.readUInt8(0);
    if (magicByte !== 0) {
      throw new Error(`Invalid magic byte: ${magicByte}`);
    }
    
    // Extract schema ID from header
    const schemaIdValue = buffer.readUInt32BE(1);
    const schemaId = schemaIdValue.toString(16).padStart(8, '0');
    
    // Get schema from registry
    const schemaInfo = registry.getSchema(schemaId);
    if (!schemaInfo) {
      throw new Error(`Schema not found for ID: ${schemaId}`);
    }
    
    // Extract data portion (skip 5-byte header)
    const dataBuffer = buffer.subarray(5);
    
    // Deserialize using JSON deserializer
    const jsonResult = mockJsonDeserializer<T>(dataBuffer, {
      ...opts,
      validateSchema: true,
      schemaVersion: schemaInfo.version,
    });
    
    if (!jsonResult.success) {
      throw new Error(jsonResult.error || 'JSON deserialization failed');
    }
    
    // Calculate performance metrics if configured
    const result: SerializationResult<T> = {
      success: true,
      data: jsonResult.data,
    };
    
    if (opts.measurePerformance) {
      result.performance = {
        duration: performance.now() - startTime,
        size: buffer.length,
      };
    }
    
    return result;
  } catch (error) {
    const result: SerializationResult<T> = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    
    if (opts.measurePerformance) {
      result.performance = {
        duration: performance.now() - startTime,
      };
    }
    
    return result;
  }
}

/**
 * Creates a validator function for a specific event type
 * 
 * @param requiredFields - Array of field names that must be present
 * @param typeValidations - Object mapping field names to type checks
 * @returns A validator function that returns true if valid or an error message
 */
export function createEventValidator(
  requiredFields: string[] = [],
  typeValidations: Record<string, (value: any) => boolean> = {}
): (data: unknown) => boolean | string {
  return (data: unknown): boolean | string => {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      return 'Data must be an object';
    }
    
    // Check required fields
    for (const field of requiredFields) {
      if (!(field in (data as Record<string, unknown>))) {
        return `Required field missing: ${field}`;
      }
    }
    
    // Check field types
    for (const [field, validator] of Object.entries(typeValidations)) {
      const value = (data as Record<string, unknown>)[field];
      if (value !== undefined && !validator(value)) {
        return `Invalid type for field: ${field}`;
      }
    }
    
    return true;
  };
}

/**
 * Creates a serializer/deserializer pair for a specific event type
 * 
 * @param validator - Validator function for the event type
 * @param options - Default serializer options
 * @returns An object with serializer and deserializer functions
 */
export function createEventSerializers<T = unknown>(
  validator?: (data: unknown) => boolean | string,
  options: MockSerializerOptions = {}
): {
  serialize: (data: T) => SerializationResult<Buffer>;
  deserialize: (buffer: Buffer) => SerializationResult<T>;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options, validator };
  
  return {
    serialize: (data: T) => mockJsonSerializer<T>(data, opts),
    deserialize: (buffer: Buffer) => mockJsonDeserializer<T>(buffer, opts),
  };
}

/**
 * Utility to test backward compatibility between different versions of an event
 * 
 * @param oldData - Data in the old format
 * @param newData - Data in the new format
 * @param oldVersion - Old schema version
 * @param newVersion - New schema version
 * @param options - Serializer options
 * @returns True if backward compatible, false otherwise
 */
export function testBackwardCompatibility<T = unknown, U = unknown>(
  oldData: T,
  newData: U,
  oldVersion: number,
  newVersion: number,
  options: MockSerializerOptions = {}
): boolean {
  try {
    // Serialize old data with old version
    const oldResult = mockJsonSerializer(oldData, {
      ...options,
      schemaVersion: oldVersion,
    });
    
    if (!oldResult.success || !oldResult.data) {
      return false;
    }
    
    // Try to deserialize old data with new version expectations
    const deserializeResult = mockJsonDeserializer(oldResult.data, {
      ...options,
      schemaVersion: newVersion,
      // Don't validate schema version for backward compatibility test
      validateSchema: false,
    });
    
    return deserializeResult.success;
  } catch (error) {
    return false;
  }
}

/**
 * Performance test utility for serializers
 * 
 * @param serializer - The serializer function to test
 * @param data - The data to serialize
 * @param iterations - Number of iterations to run
 * @returns Performance metrics
 */
export function benchmarkSerializer<T = unknown>(
  serializer: (data: T) => SerializationResult<Buffer>,
  data: T,
  iterations: number = 1000
): {
  averageDuration: number;
  totalDuration: number;
  iterations: number;
  averageSize: number;
} {
  let totalDuration = 0;
  let totalSize = 0;
  let successCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const result = serializer(data);
    const endTime = performance.now();
    
    if (result.success && result.data) {
      totalDuration += (endTime - startTime);
      totalSize += result.data.length;
      successCount++;
    }
  }
  
  return {
    averageDuration: successCount > 0 ? totalDuration / successCount : 0,
    totalDuration,
    iterations: successCount,
    averageSize: successCount > 0 ? totalSize / successCount : 0,
  };
}
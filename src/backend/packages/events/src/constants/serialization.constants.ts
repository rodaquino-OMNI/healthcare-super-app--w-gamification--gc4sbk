/**
 * Constants related to event serialization formats, encoding options, and schema validation settings.
 * These constants ensure consistent serialization and deserialization of events across all producers and consumers.
 */

/**
 * Supported serialization formats for events
 */
export enum SerializationFormat {
  /**
   * JavaScript Object Notation - Human-readable text format
   * Best for debugging and human readability
   */
  JSON = 'json',
  
  /**
   * Apache Avro - Binary format with schema evolution support
   * Best for big data, distributed systems, and analytics scenarios
   */
  AVRO = 'avro',
  
  /**
   * Protocol Buffers - Compact binary format by Google
   * Best for low-latency, high-performance scenarios
   */
  PROTOBUF = 'protobuf'
}

/**
 * Default serialization format to use when none is specified
 */
export const DEFAULT_SERIALIZATION_FORMAT = SerializationFormat.JSON;

/**
 * Character encoding options for serialized data
 */
export enum CharacterEncoding {
  /**
   * UTF-8 encoding - Standard for JSON and text-based formats
   */
  UTF8 = 'utf8',
  
  /**
   * UTF-16 encoding - Used for wider character support
   */
  UTF16 = 'utf16le',
  
  /**
   * ASCII encoding - Limited to basic Latin characters
   */
  ASCII = 'ascii',
  
  /**
   * Binary encoding - Raw binary data
   */
  BINARY = 'binary'
}

/**
 * Default character encoding to use when none is specified
 */
export const DEFAULT_CHARACTER_ENCODING = CharacterEncoding.UTF8;

/**
 * Compression algorithms supported for event payloads
 */
export enum CompressionType {
  /**
   * No compression
   */
  NONE = 'none',
  
  /**
   * GZIP compression - High compression ratio but slower
   * Best for storage optimization when CPU is not a concern
   */
  GZIP = 'gzip',
  
  /**
   * Snappy compression - Moderate compression with good speed
   * Good balance between compression and performance
   */
  SNAPPY = 'snappy',
  
  /**
   * LZ4 compression - Fast compression with moderate ratio
   * Best for high-throughput scenarios
   */
  LZ4 = 'lz4',
  
  /**
   * Zstandard compression - Better compression than GZIP with better performance
   * Good for both storage optimization and performance
   */
  ZSTD = 'zstd'
}

/**
 * Default compression type to use when none is specified
 */
export const DEFAULT_COMPRESSION_TYPE = CompressionType.NONE;

/**
 * Content type identifiers for proper message interpretation
 */
export enum ContentType {
  /**
   * JSON content type
   */
  JSON = 'application/json',
  
  /**
   * Avro binary content type
   */
  AVRO = 'application/avro',
  
  /**
   * Protocol Buffers binary content type
   */
  PROTOBUF = 'application/protobuf',
  
  /**
   * Plain text content type
   */
  TEXT = 'text/plain',
  
  /**
   * Binary content type
   */
  BINARY = 'application/octet-stream'
}

/**
 * Maps serialization formats to their corresponding content types
 */
export const SERIALIZATION_FORMAT_CONTENT_TYPE_MAP: Record<SerializationFormat, ContentType> = {
  [SerializationFormat.JSON]: ContentType.JSON,
  [SerializationFormat.AVRO]: ContentType.AVRO,
  [SerializationFormat.PROTOBUF]: ContentType.PROTOBUF
};

/**
 * Schema registry configuration defaults
 */
export const SCHEMA_REGISTRY = {
  /**
   * Default URL for the schema registry
   */
  DEFAULT_URL: 'http://localhost:8081',
  
  /**
   * Default timeout in milliseconds for schema registry requests
   */
  DEFAULT_TIMEOUT_MS: 5000,
  
  /**
   * Maximum number of schemas to cache
   */
  MAX_CACHE_SIZE: 100,
  
  /**
   * Default compatibility mode for schema evolution
   */
  DEFAULT_COMPATIBILITY: 'BACKWARD',
  
  /**
   * Available compatibility modes for schema evolution
   */
  COMPATIBILITY_MODES: {
    /**
     * New schema can read data written with old schema
     */
    BACKWARD: 'BACKWARD',
    
    /**
     * Old schema can read data written with new schema
     */
    FORWARD: 'FORWARD',
    
    /**
     * Both backward and forward compatibility
     */
    FULL: 'FULL',
    
    /**
     * No compatibility checks
     */
    NONE: 'NONE'
  }
};

/**
 * Serialization error codes
 */
export enum SerializationErrorCode {
  /**
   * Failed to serialize data
   */
  SERIALIZATION_FAILED = 'SERIALIZATION_001',
  
  /**
   * Failed to deserialize data
   */
  DESERIALIZATION_FAILED = 'SERIALIZATION_002',
  
  /**
   * Schema validation failed
   */
  SCHEMA_VALIDATION_FAILED = 'SERIALIZATION_003',
  
  /**
   * Compression failed
   */
  COMPRESSION_FAILED = 'SERIALIZATION_004',
  
  /**
   * Decompression failed
   */
  DECOMPRESSION_FAILED = 'SERIALIZATION_005',
  
  /**
   * Schema registry connection failed
   */
  SCHEMA_REGISTRY_CONNECTION_FAILED = 'SERIALIZATION_006',
  
  /**
   * Schema not found in registry
   */
  SCHEMA_NOT_FOUND = 'SERIALIZATION_007',
  
  /**
   * Unsupported serialization format
   */
  UNSUPPORTED_FORMAT = 'SERIALIZATION_008',
  
  /**
   * Unsupported compression type
   */
  UNSUPPORTED_COMPRESSION = 'SERIALIZATION_009'
}

/**
 * Configuration options for serialization
 */
export interface SerializationOptions {
  /**
   * Serialization format to use
   */
  format?: SerializationFormat;
  
  /**
   * Character encoding to use
   */
  encoding?: CharacterEncoding;
  
  /**
   * Compression type to use
   */
  compression?: CompressionType;
  
  /**
   * Whether to validate against schema
   */
  validateSchema?: boolean;
  
  /**
   * Schema registry URL
   */
  schemaRegistryUrl?: string;
  
  /**
   * Schema version to use
   */
  schemaVersion?: number;
  
  /**
   * Additional options for specific serialization formats
   */
  formatOptions?: Record<string, any>;
}

/**
 * Default serialization options
 */
export const DEFAULT_SERIALIZATION_OPTIONS: SerializationOptions = {
  format: DEFAULT_SERIALIZATION_FORMAT,
  encoding: DEFAULT_CHARACTER_ENCODING,
  compression: DEFAULT_COMPRESSION_TYPE,
  validateSchema: true,
  schemaRegistryUrl: SCHEMA_REGISTRY.DEFAULT_URL,
  formatOptions: {}
};

/**
 * Batch serialization configuration
 */
export const BATCH_SERIALIZATION = {
  /**
   * Maximum batch size in bytes
   */
  MAX_BATCH_SIZE_BYTES: 1000000, // 1MB
  
  /**
   * Default batch size in bytes
   */
  DEFAULT_BATCH_SIZE_BYTES: 16384, // 16KB
  
  /**
   * Maximum number of messages in a batch
   */
  MAX_BATCH_MESSAGE_COUNT: 500,
  
  /**
   * Default number of messages in a batch
   */
  DEFAULT_BATCH_MESSAGE_COUNT: 100,
  
  /**
   * Maximum linger time in milliseconds
   */
  MAX_LINGER_MS: 1000, // 1 second
  
  /**
   * Default linger time in milliseconds
   */
  DEFAULT_LINGER_MS: 5 // 5 milliseconds
};
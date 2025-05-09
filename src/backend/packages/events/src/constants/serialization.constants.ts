/**
 * Constants related to event serialization formats, encoding options, and schema validation settings.
 * These constants ensure consistent serialization and deserialization of events across all producers
 * and consumers, preventing data corruption or misinterpretation.
 */

/**
 * Supported serialization formats for event payloads.
 * - JSON: Standard JSON format, good for human readability and debugging
 * - AVRO: Binary format with schema validation, efficient for high-volume events
 * - PROTOBUF: Protocol Buffers format, highly efficient binary serialization
 */
export enum SerializationFormat {
  JSON = 'json',
  AVRO = 'avro',
  PROTOBUF = 'protobuf',
}

/**
 * Content type identifiers for serialized event payloads.
 * Used in message headers to indicate the format of the payload.
 */
export const CONTENT_TYPES = {
  [SerializationFormat.JSON]: 'application/json',
  [SerializationFormat.AVRO]: 'application/avro',
  [SerializationFormat.PROTOBUF]: 'application/protobuf',
} as const;

/**
 * Default serialization format to use when none is specified.
 */
export const DEFAULT_SERIALIZATION_FORMAT = SerializationFormat.JSON;

/**
 * Character encoding options for string serialization.
 */
export enum CharacterEncoding {
  UTF8 = 'utf8',
  ASCII = 'ascii',
  BASE64 = 'base64',
  HEX = 'hex',
  BINARY = 'binary',
}

/**
 * Default character encoding to use for string serialization.
 */
export const DEFAULT_CHARACTER_ENCODING = CharacterEncoding.UTF8;

/**
 * Compression algorithms available for event payload compression.
 * - NONE: No compression
 * - GZIP: Standard gzip compression, good balance of speed and compression ratio
 * - SNAPPY: Fast compression with moderate compression ratio
 * - LZ4: Very fast compression with moderate compression ratio
 */
export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  SNAPPY = 'snappy',
  LZ4 = 'lz4',
}

/**
 * Default compression type to use when none is specified.
 */
export const DEFAULT_COMPRESSION_TYPE = CompressionType.NONE;

/**
 * Compression level options for GZIP compression.
 * - 0: No compression
 * - 1: Best speed
 * - 9: Best compression
 */
export const COMPRESSION_LEVELS = {
  NONE: 0,
  BEST_SPEED: 1,
  BALANCED: 5,
  BEST_COMPRESSION: 9,
} as const;

/**
 * Default compression level for GZIP compression.
 */
export const DEFAULT_COMPRESSION_LEVEL = COMPRESSION_LEVELS.BALANCED;

/**
 * Schema registry configuration defaults.
 * Used for validating event schemas during serialization/deserialization.
 */
export const SCHEMA_REGISTRY = {
  /** Default URL for the schema registry service */
  URL: 'http://schema-registry:8081',
  
  /** Default timeout in milliseconds for schema registry requests */
  TIMEOUT_MS: 5000,
  
  /** Maximum number of schemas to cache in memory */
  MAX_CACHE_SIZE: 100,
  
  /** Whether to auto-register schemas that don't exist in the registry */
  AUTO_REGISTER_SCHEMAS: true,
  
  /** Whether to validate schemas during serialization/deserialization */
  VALIDATE_SCHEMAS: true,
} as const;

/**
 * Serialization error codes for consistent error reporting.
 */
export enum SerializationErrorCode {
  /** Failed to serialize event payload */
  SERIALIZATION_FAILED = 'EVENTS_SERIALIZATION_001',
  
  /** Failed to deserialize event payload */
  DESERIALIZATION_FAILED = 'EVENTS_SERIALIZATION_002',
  
  /** Schema validation failed during serialization/deserialization */
  SCHEMA_VALIDATION_FAILED = 'EVENTS_SERIALIZATION_003',
  
  /** Compression/decompression failed */
  COMPRESSION_FAILED = 'EVENTS_SERIALIZATION_004',
  
  /** Schema registry operation failed */
  SCHEMA_REGISTRY_ERROR = 'EVENTS_SERIALIZATION_005',
  
  /** Unsupported serialization format */
  UNSUPPORTED_FORMAT = 'EVENTS_SERIALIZATION_006',
}

/**
 * Configuration for JSON serialization.
 */
export const JSON_SERIALIZATION = {
  /** Whether to pretty-print JSON for debugging */
  PRETTY_PRINT: false,
  
  /** Number of spaces to use for indentation when pretty-printing */
  INDENT_SPACES: 2,
  
  /** Maximum depth for circular reference detection */
  MAX_DEPTH: 100,
  
  /** Whether to escape HTML characters in JSON strings */
  ESCAPE_HTML: false,
} as const;

/**
 * Binary serialization options.
 */
export const BINARY_SERIALIZATION = {
  /** Whether to include a magic byte at the beginning of binary payloads */
  INCLUDE_MAGIC_BYTE: true,
  
  /** Magic byte value to use for identifying binary payloads */
  MAGIC_BYTE: 0x0,
  
  /** Whether to include schema ID in binary payloads */
  INCLUDE_SCHEMA_ID: true,
  
  /** Number of bytes to use for schema ID */
  SCHEMA_ID_BYTES: 4,
} as const;

/**
 * Header keys for serialization metadata.
 */
export const SERIALIZATION_HEADERS = {
  /** Header key for content type */
  CONTENT_TYPE: 'content-type',
  
  /** Header key for content encoding (compression) */
  CONTENT_ENCODING: 'content-encoding',
  
  /** Header key for schema ID */
  SCHEMA_ID: 'schema-id',
  
  /** Header key for schema version */
  SCHEMA_VERSION: 'schema-version',
  
  /** Header key for serialization format */
  SERIALIZATION_FORMAT: 'serialization-format',
} as const;

/**
 * Default serialization options to use when none are specified.
 */
export const DEFAULT_SERIALIZATION_OPTIONS = {
  format: DEFAULT_SERIALIZATION_FORMAT,
  encoding: DEFAULT_CHARACTER_ENCODING,
  compression: DEFAULT_COMPRESSION_TYPE,
  compressionLevel: DEFAULT_COMPRESSION_LEVEL,
  validateSchema: SCHEMA_REGISTRY.VALIDATE_SCHEMAS,
  jsonOptions: JSON_SERIALIZATION,
  binaryOptions: BINARY_SERIALIZATION,
} as const;

/**
 * Interface for serialization options.
 */
export interface SerializationOptions {
  /** Serialization format to use */
  format?: SerializationFormat;
  
  /** Character encoding to use for string serialization */
  encoding?: CharacterEncoding;
  
  /** Compression type to use */
  compression?: CompressionType;
  
  /** Compression level to use (for GZIP) */
  compressionLevel?: number;
  
  /** Whether to validate schema during serialization */
  validateSchema?: boolean;
  
  /** JSON serialization options */
  jsonOptions?: Partial<typeof JSON_SERIALIZATION>;
  
  /** Binary serialization options */
  binaryOptions?: Partial<typeof BINARY_SERIALIZATION>;
}
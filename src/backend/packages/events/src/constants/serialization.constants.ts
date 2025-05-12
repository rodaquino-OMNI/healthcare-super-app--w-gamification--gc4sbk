/**
 * Event Serialization Constants
 * 
 * This file defines constants related to event serialization formats, encoding options,
 * and schema validation settings. These constants ensure consistent serialization and
 * deserialization of events across all producers and consumers, preventing data corruption
 * or misinterpretation.
 * 
 * @module @austa/events/constants/serialization
 */

// -----------------------------------------------------------------------------
// Serialization Format Constants
// -----------------------------------------------------------------------------

/**
 * Supported serialization formats for events
 * These formats determine how events are serialized and deserialized
 * when transmitted between services.
 */
export enum SerializationFormat {
  /** JSON serialization format (default) */
  JSON = 'application/json',
  /** Apache Avro binary serialization format */
  AVRO = 'application/avro',
  /** Protocol Buffers binary serialization format */
  PROTOBUF = 'application/protobuf',
  /** MessagePack compact binary serialization format */
  MSGPACK = 'application/msgpack',
  /** CBOR (Concise Binary Object Representation) format */
  CBOR = 'application/cbor',
}

/**
 * Default serialization format to use when none is specified
 */
export const DEFAULT_SERIALIZATION_FORMAT = SerializationFormat.JSON;

/**
 * Maps serialization formats to their MIME content types
 * Used for HTTP headers and message metadata
 */
export const SERIALIZATION_CONTENT_TYPES: Record<SerializationFormat, string> = {
  [SerializationFormat.JSON]: 'application/json',
  [SerializationFormat.AVRO]: 'application/avro',
  [SerializationFormat.PROTOBUF]: 'application/protobuf',
  [SerializationFormat.MSGPACK]: 'application/msgpack',
  [SerializationFormat.CBOR]: 'application/cbor',
};

/**
 * Maps serialization formats to their file extensions
 * Used for schema file naming and identification
 */
export const SERIALIZATION_FILE_EXTENSIONS: Record<SerializationFormat, string> = {
  [SerializationFormat.JSON]: '.json',
  [SerializationFormat.AVRO]: '.avsc',
  [SerializationFormat.PROTOBUF]: '.proto',
  [SerializationFormat.MSGPACK]: '.msgpack',
  [SerializationFormat.CBOR]: '.cbor',
};

// -----------------------------------------------------------------------------
// Encoding Constants
// -----------------------------------------------------------------------------

/**
 * Supported character encodings for string serialization
 */
export enum CharacterEncoding {
  /** UTF-8 encoding (default) */
  UTF8 = 'utf8',
  /** UTF-16 encoding */
  UTF16 = 'utf16le',
  /** ASCII encoding */
  ASCII = 'ascii',
  /** Latin-1 encoding */
  LATIN1 = 'latin1',
  /** Base64 encoding */
  BASE64 = 'base64',
  /** Hexadecimal encoding */
  HEX = 'hex',
}

/**
 * Default character encoding to use when none is specified
 */
export const DEFAULT_CHARACTER_ENCODING = CharacterEncoding.UTF8;

/**
 * Maximum event size in bytes
 * Events larger than this will be rejected
 */
export const MAX_EVENT_SIZE_BYTES = 1024 * 1024; // 1MB

/**
 * Default buffer size for binary serialization
 */
export const DEFAULT_BUFFER_SIZE = 16384; // 16KB

// -----------------------------------------------------------------------------
// Compression Constants
// -----------------------------------------------------------------------------

/**
 * Supported compression algorithms for event payloads
 */
export enum CompressionAlgorithm {
  /** No compression */
  NONE = 'none',
  /** GZIP compression */
  GZIP = 'gzip',
  /** Snappy compression */
  SNAPPY = 'snappy',
  /** LZ4 compression */
  LZ4 = 'lz4',
  /** Zstandard compression */
  ZSTD = 'zstd',
}

/**
 * Default compression algorithm to use when none is specified
 */
export const DEFAULT_COMPRESSION_ALGORITHM = CompressionAlgorithm.NONE;

/**
 * Minimum event size in bytes for applying compression
 * Events smaller than this will not be compressed
 */
export const MIN_COMPRESSION_SIZE_BYTES = 1024; // 1KB

/**
 * Compression level settings for different algorithms
 * Higher values indicate more compression but slower processing
 */
export const COMPRESSION_LEVELS = {
  [CompressionAlgorithm.GZIP]: {
    MIN: 1, // Fastest, least compression
    DEFAULT: 6, // Balanced
    MAX: 9, // Slowest, most compression
  },
  [CompressionAlgorithm.ZSTD]: {
    MIN: 1, // Fastest, least compression
    DEFAULT: 3, // Balanced
    MAX: 22, // Slowest, most compression
  },
  [CompressionAlgorithm.LZ4]: {
    MIN: 0, // Fastest, least compression
    DEFAULT: 1, // Balanced
    MAX: 16, // Slowest, most compression
  },
};

/**
 * Default compression level to use when none is specified
 */
export const DEFAULT_COMPRESSION_LEVEL = {
  [CompressionAlgorithm.GZIP]: COMPRESSION_LEVELS[CompressionAlgorithm.GZIP].DEFAULT,
  [CompressionAlgorithm.ZSTD]: COMPRESSION_LEVELS[CompressionAlgorithm.ZSTD].DEFAULT,
  [CompressionAlgorithm.LZ4]: COMPRESSION_LEVELS[CompressionAlgorithm.LZ4].DEFAULT,
  [CompressionAlgorithm.SNAPPY]: 0, // Snappy doesn't support compression levels
  [CompressionAlgorithm.NONE]: 0, // No compression
};

// -----------------------------------------------------------------------------
// Schema Registry Constants
// -----------------------------------------------------------------------------

/**
 * Schema registry URL for Avro and Protobuf schemas
 */
export const SCHEMA_REGISTRY_URL = 'http://schema-registry:8081';

/**
 * Schema registry authentication settings
 */
export const SCHEMA_REGISTRY_AUTH = {
  /** Whether authentication is enabled */
  ENABLED: false,
  /** Authentication username */
  USERNAME: '',
  /** Authentication password */
  PASSWORD: '',
};

/**
 * Schema compatibility modes for schema evolution
 */
export enum SchemaCompatibilityMode {
  /** No compatibility checks */
  NONE = 'NONE',
  /** New schema must be forward compatible with latest schema */
  FORWARD = 'FORWARD',
  /** New schema must be backward compatible with latest schema */
  BACKWARD = 'BACKWARD',
  /** New schema must be both forward and backward compatible with latest schema */
  FULL = 'FULL',
  /** New schema must be forward compatible with all previous schemas */
  FORWARD_TRANSITIVE = 'FORWARD_TRANSITIVE',
  /** New schema must be backward compatible with all previous schemas */
  BACKWARD_TRANSITIVE = 'BACKWARD_TRANSITIVE',
  /** New schema must be both forward and backward compatible with all previous schemas */
  FULL_TRANSITIVE = 'FULL_TRANSITIVE',
}

/**
 * Default schema compatibility mode
 */
export const DEFAULT_SCHEMA_COMPATIBILITY_MODE = SchemaCompatibilityMode.BACKWARD;

/**
 * Schema registry subject naming strategy
 */
export enum SchemaSubjectNamingStrategy {
  /** Topic name + value suffix */
  TOPIC_NAME_STRATEGY = 'io.confluent.kafka.serializers.subject.TopicNameStrategy',
  /** Record name strategy */
  RECORD_NAME_STRATEGY = 'io.confluent.kafka.serializers.subject.RecordNameStrategy',
  /** Topic record name strategy */
  TOPIC_RECORD_NAME_STRATEGY = 'io.confluent.kafka.serializers.subject.TopicRecordNameStrategy',
}

/**
 * Default schema subject naming strategy
 */
export const DEFAULT_SCHEMA_SUBJECT_NAMING_STRATEGY = SchemaSubjectNamingStrategy.TOPIC_NAME_STRATEGY;

// -----------------------------------------------------------------------------
// Serialization Options Constants
// -----------------------------------------------------------------------------

/**
 * JSON serialization options
 */
export const JSON_SERIALIZATION_OPTIONS = {
  /** Whether to pretty-print JSON (for debugging) */
  PRETTY_PRINT: false,
  /** Number of spaces to use for indentation when pretty-printing */
  INDENT_SPACES: 2,
  /** Whether to escape non-ASCII characters */
  ESCAPE_NON_ASCII: false,
  /** Whether to include null values in serialized output */
  INCLUDE_NULL_VALUES: true,
};

/**
 * Avro serialization options
 */
export const AVRO_SERIALIZATION_OPTIONS = {
  /** Whether to use the Confluent Schema Registry wire format */
  USE_CONFLUENT_WIRE_FORMAT: true,
  /** Whether to validate data against schema during serialization */
  VALIDATE_SCHEMA: true,
  /** Whether to include schema fingerprint in serialized output */
  INCLUDE_SCHEMA_FINGERPRINT: true,
};

/**
 * Protocol Buffers serialization options
 */
export const PROTOBUF_SERIALIZATION_OPTIONS = {
  /** Whether to use the Confluent Schema Registry wire format */
  USE_CONFLUENT_WIRE_FORMAT: true,
  /** Whether to validate data against schema during serialization */
  VALIDATE_SCHEMA: true,
  /** Whether to use binary format (true) or JSON format (false) */
  USE_BINARY_FORMAT: true,
};

/**
 * MessagePack serialization options
 */
export const MSGPACK_SERIALIZATION_OPTIONS = {
  /** Whether to sort keys during serialization */
  SORT_KEYS: false,
  /** Whether to serialize undefined as null */
  SERIALIZE_UNDEFINED_AS_NULL: true,
  /** Whether to use the MessagePack timestamp extension */
  USE_TIMESTAMP_EXTENSION: true,
};

/**
 * CBOR serialization options
 */
export const CBOR_SERIALIZATION_OPTIONS = {
  /** Whether to sort keys during serialization */
  SORT_KEYS: false,
  /** Whether to use the CBOR date/time tag */
  USE_DATE_TIME_TAG: true,
  /** Whether to use the CBOR undefined tag */
  USE_UNDEFINED_TAG: true,
};

// -----------------------------------------------------------------------------
// Content Type Constants
// -----------------------------------------------------------------------------

/**
 * Content type header name for HTTP and Kafka messages
 */
export const CONTENT_TYPE_HEADER = 'content-type';

/**
 * Content encoding header name for HTTP and Kafka messages
 */
export const CONTENT_ENCODING_HEADER = 'content-encoding';

/**
 * Schema version header name for Kafka messages
 */
export const SCHEMA_VERSION_HEADER = 'schema-version';

/**
 * Maps compression algorithms to content encoding values
 */
export const COMPRESSION_CONTENT_ENCODINGS: Record<CompressionAlgorithm, string> = {
  [CompressionAlgorithm.NONE]: '',
  [CompressionAlgorithm.GZIP]: 'gzip',
  [CompressionAlgorithm.SNAPPY]: 'snappy',
  [CompressionAlgorithm.LZ4]: 'lz4',
  [CompressionAlgorithm.ZSTD]: 'zstd',
};

/**
 * Default content type to use when none is specified
 */
export const DEFAULT_CONTENT_TYPE = SERIALIZATION_CONTENT_TYPES[DEFAULT_SERIALIZATION_FORMAT];

// -----------------------------------------------------------------------------
// Serialization Error Constants
// -----------------------------------------------------------------------------

/**
 * Maximum number of serialization errors to cache
 * Used for error tracking and reporting
 */
export const MAX_SERIALIZATION_ERROR_CACHE_SIZE = 100;

/**
 * Time-to-live for cached serialization errors in milliseconds
 */
export const SERIALIZATION_ERROR_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Whether to include the original payload in serialization error reports
 * Set to false in production to avoid logging sensitive data
 */
export const INCLUDE_PAYLOAD_IN_ERROR_REPORTS = false;

/**
 * Maximum payload excerpt length to include in error reports
 */
export const MAX_ERROR_PAYLOAD_EXCERPT_LENGTH = 1000; // characters